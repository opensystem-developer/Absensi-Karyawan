import { Router } from 'express';
import db from '../db.js';
import alamatRouter from './alamat.js';
import kontakRouter from './kontak.js';
import keluargaRouter from './keluarga.js';
import pendidikanRouter from './pendidikan.js';
import posisiRouter from './posisi.js';
import kontrakRouter from './kontrak.js';
import employeeShiftsRouter from './employeeShifts.js';
import workSchedulesRouter from './workSchedules.js';
import attendancesRouter from './attendances.js';
import {
  getUserId, withAuditOnCreate, withAuditOnUpdate, softDeleteParams,
  NOT_DELETED, handleDbError,
} from '../utils/audit.js';
import { logActivity, logDataChanges, diffRecords } from '../utils/logging.js';
import { checkMasterDataReady, assertMasterDataReady } from '../utils/masterData.js';
import { generateEmployeeNo } from '../utils/employeeNo.js';
import { enrichKaryawanListWithPositions, enrichKaryawanWithPosition } from '../utils/karyawanHelpers.js';
import { branchSqlInClause, resolveBranchFilter } from '../utils/branchAccess.js';

const router = Router();

const PERSONAL_FIELDS = [
  'nik', 'nama_lengkap', 'nama_panggilan', 'jenis_kelamin',
  'tempat_lahir', 'tanggal_lahir', 'agama', 'status_pernikahan', 'jumlah_anak',
  'no_kk', 'npwp', 'no_bpjs_kesehatan', 'no_bpjs_tk',
];

const PEKERJAAN_FIELDS = [
  'branch_id', 'employee_no', 'tanggal_masuk', 'tanggal_keluar',
  'status_karyawan', 'alasan_keluar', 'keterangan',
];

const FIELDS = [...PERSONAL_FIELDS, ...PEKERJAAN_FIELDS];

function isDraftEmployeeNo(no) {
  return !no || String(no).startsWith('DRAFT/');
}

function generateDraftEmployeeNo(nik) {
  return `DRAFT/${nik}/${Date.now()}`;
}

function pickFields(body, fieldList) {
  const data = {};
  for (const field of fieldList) {
    if (body[field] !== undefined) {
      data[field] = body[field] === '' ? null : body[field];
    }
  }
  if (data.jumlah_anak !== undefined && data.jumlah_anak !== null) {
    data.jumlah_anak = parseInt(data.jumlah_anak, 10) || 0;
  }
  if (data.branch_id !== undefined && data.branch_id !== null && data.branch_id !== '') {
    data.branch_id = parseInt(data.branch_id, 10);
  }
  return data;
}

router.get('/setup-status', (_req, res) => {
  try {
    res.json(checkMasterDataReady(db));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.get('/preview-employee-no', (req, res) => {
  try {
    const { branch_id, tanggal_masuk } = req.query;
    if (!branch_id) return res.status(400).json({ error: 'branch_id wajib diisi' });
    assertMasterDataReady(db);
    const employeeNo = generateEmployeeNo(db, branch_id, tanggal_masuk || null);
    res.json({ employee_no: employeeNo });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    handleDbError(err, res);
  }
});

router.get('/', (req, res) => {
  try {
    const { search, status, branch_id: branchIdQuery } = req.query;
    const branchFilter = resolveBranchFilter(req, branchIdQuery);
    if (branchFilter.error) return res.status(403).json({ error: branchFilter.error });

    let sql = `SELECT k.*, b.code AS branch_code, b.name AS branch_name
      FROM karyawan k
      LEFT JOIN branches b ON b.id = k.branch_id AND b.deleted_at IS NULL
      WHERE k.deleted_at IS NULL`;
    const params = [];

    const branchClause = branchSqlInClause(branchFilter.branchIds, 'k.branch_id');
    sql += branchClause.sql;
    params.push(...branchClause.params);

    if (search) {
      sql += ` AND (k.nama_lengkap LIKE ? OR k.employee_no LIKE ? OR k.nik LIKE ? OR k.nama_panggilan LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (status) {
      sql += ' AND k.status_karyawan = ?';
      params.push(status);
    }

    sql += ' ORDER BY k.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(enrichKaryawanListWithPositions(db, rows));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.use('/:employeeId/alamat', alamatRouter);
router.use('/:employeeId/kontak', kontakRouter);
router.use('/:employeeId/keluarga', keluargaRouter);
router.use('/:employeeId/pendidikan', pendidikanRouter);
router.use('/:employeeId/posisi', posisiRouter);
router.use('/:employeeId/kontrak', kontrakRouter);
router.use('/:employeeId/employee-shifts', employeeShiftsRouter);
router.use('/:employeeId/work-schedules', workSchedulesRouter);
router.use('/:employeeId/attendances', attendancesRouter);

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM karyawan WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    res.json(enrichKaryawanWithPosition(db, row));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.post('/', (req, res) => {
  try {
    const userId = getUserId(req);
    let data = pickFields(req.body, PERSONAL_FIELDS);
    if (!data.nik || !data.nama_lengkap) {
      return res.status(400).json({ error: 'nik dan nama_lengkap wajib diisi' });
    }

    data.employee_no = generateDraftEmployeeNo(data.nik);
    data.status_karyawan = 'Aktif';

    data = withAuditOnCreate(data, userId);
    const cols = Object.keys(data);
    const result = db.prepare(
      `INSERT INTO karyawan (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
    ).run(...cols.map((c) => data[c]));
    const created = db.prepare('SELECT * FROM karyawan WHERE id = ?').get(result.lastInsertRowid);
    logDataChanges({ tableName: 'karyawan', recordId: created.id, employeeId: created.id, action: 'CREATE', changes: FIELDS.map((f) => ({ field: f, oldValue: null, newValue: created[f] })), changedBy: userId });
    logActivity({ userId: req.user?.id, username: userId, action: 'CREATE', module: 'karyawan', entityId: created.id, description: `Tambah karyawan ${created.nama_lengkap}`, ip: req.ip });
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const msg = err.message.includes('employee_no')
        ? 'Nomor karyawan sudah terdaftar'
        : err.message.includes('nik')
          ? 'NIK sudah terdaftar'
          : 'Data duplikat ditemukan';
      return res.status(409).json({ error: msg });
    }
    handleDbError(err, res);
  }
});

router.put('/:id/pekerjaan', (req, res) => {
  try {
    const userId = getUserId(req);
    assertMasterDataReady(db);

    const existing = db.prepare(`SELECT * FROM karyawan WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });

    let data = pickFields(req.body, PEKERJAAN_FIELDS);
    if (!isDraftEmployeeNo(existing.employee_no)) {
      delete data.branch_id;
      delete data.employee_no;
    } else if (!data.branch_id) {
      return res.status(400).json({ error: 'Cabang wajib dipilih untuk menetapkan pekerjaan karyawan' });
    }

    if (isDraftEmployeeNo(existing.employee_no) && data.branch_id) {
      data.employee_no = generateEmployeeNo(db, data.branch_id, data.tanggal_masuk || null);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Tidak ada data untuk diperbarui' });
    }

    data = withAuditOnUpdate(data, userId);
    const sets = Object.keys(data).map((k) => `${k} = ?`).join(', ');
    db.prepare(`UPDATE karyawan SET ${sets} WHERE id = ?`).run(...Object.values(data), req.params.id);

    const updated = db.prepare('SELECT * FROM karyawan WHERE id = ?').get(req.params.id);
    const changes = diffRecords(existing, updated, PEKERJAAN_FIELDS);
    logDataChanges({ tableName: 'karyawan', recordId: updated.id, employeeId: updated.id, action: 'UPDATE', changes, changedBy: userId });
    logActivity({ userId: req.user?.id, username: userId, action: 'UPDATE', module: 'karyawan_pekerjaan', entityId: updated.id, description: `Ubah pekerjaan karyawan ${updated.nama_lengkap}`, ip: req.ip });
    res.json(updated);
  } catch (err) {
    handleDbError(err, res);
  }
});

router.put('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = db.prepare(`SELECT * FROM karyawan WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });

    let data = pickFields(req.body, PERSONAL_FIELDS);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Tidak ada data untuk diperbarui' });
    }

    data = withAuditOnUpdate(data, userId);
    const sets = Object.keys(data).map((k) => `${k} = ?`).join(', ');
    db.prepare(`UPDATE karyawan SET ${sets} WHERE id = ?`).run(
      ...Object.values(data),
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM karyawan WHERE id = ?').get(req.params.id);
    const changes = diffRecords(existing, updated, PERSONAL_FIELDS);
    logDataChanges({ tableName: 'karyawan', recordId: updated.id, employeeId: updated.id, action: 'UPDATE', changes, changedBy: userId });
    logActivity({ userId: req.user?.id, username: userId, action: 'UPDATE', module: 'karyawan', entityId: updated.id, description: `Ubah karyawan ${updated.nama_lengkap}`, ip: req.ip });
    res.json(updated);
  } catch (err) {
    handleDbError(err, res);
  }
});

router.delete('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = db.prepare(`SELECT * FROM karyawan WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });

    const del = softDeleteParams(userId);
    db.prepare(
      `UPDATE karyawan SET deleted_by = ?, deleted_at = ?, updated_by = ?, updated_at = ? WHERE id = ?`
    ).run(del.deleted_by, del.deleted_at, userId, del.deleted_at, req.params.id);

    logDataChanges({ tableName: 'karyawan', recordId: existing.id, employeeId: existing.id, action: 'DELETE', changes: [{ field: 'nama_lengkap', oldValue: existing.nama_lengkap, newValue: null }], changedBy: userId });
    logActivity({ userId: req.user?.id, username: userId, action: 'DELETE', module: 'karyawan', entityId: existing.id, description: `Hapus karyawan ${existing.nama_lengkap}`, ip: req.ip });
    res.json({ message: 'Karyawan berhasil dihapus' });
  } catch (err) {
    handleDbError(err, res);
  }
});

export default router;
