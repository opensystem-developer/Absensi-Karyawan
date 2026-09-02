import { Router } from 'express';
import db from '../db.js';
import alamatRouter from './alamat.js';
import kontakRouter from './kontak.js';
import keluargaRouter from './keluarga.js';
import pendidikanRouter from './pendidikan.js';
import {
  getUserId, withAuditOnCreate, withAuditOnUpdate, softDeleteParams,
  NOT_DELETED, handleDbError,
} from '../utils/audit.js';

const router = Router();

const FIELDS = [
  'employee_no', 'nik', 'nama_lengkap', 'nama_panggilan', 'jenis_kelamin',
  'tempat_lahir', 'tanggal_lahir', 'agama', 'status_pernikahan', 'jumlah_anak',
  'no_kk', 'npwp', 'no_bpjs_kesehatan', 'no_bpjs_tk', 'tanggal_masuk',
  'tanggal_keluar', 'status_karyawan', 'alasan_keluar', 'keterangan',
];

function pickFields(body) {
  const data = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field] === '' ? null : body[field];
    }
  }
  if (data.jumlah_anak !== undefined && data.jumlah_anak !== null) {
    data.jumlah_anak = parseInt(data.jumlah_anak, 10) || 0;
  }
  return data;
}

router.get('/', (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = `SELECT * FROM karyawan WHERE ${NOT_DELETED}`;
    const params = [];

    if (search) {
      sql += ` AND (nama_lengkap LIKE ? OR employee_no LIKE ? OR nik LIKE ? OR nama_panggilan LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (status) {
      sql += ' AND status_karyawan = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    handleDbError(err, res);
  }
});

router.use('/:employeeId/alamat', alamatRouter);
router.use('/:employeeId/kontak', kontakRouter);
router.use('/:employeeId/keluarga', keluargaRouter);
router.use('/:employeeId/pendidikan', pendidikanRouter);

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM karyawan WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    res.json(row);
  } catch (err) {
    handleDbError(err, res);
  }
});

router.post('/', (req, res) => {
  try {
    const userId = getUserId(req);
    let data = pickFields(req.body);
    if (!data.employee_no || !data.nik || !data.nama_lengkap) {
      return res.status(400).json({ error: 'employee_no, nik, dan nama_lengkap wajib diisi' });
    }

    data = withAuditOnCreate(data, userId);
    const cols = Object.keys(data);
    const result = db.prepare(
      `INSERT INTO karyawan (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
    ).run(...cols.map((c) => data[c]));
    const created = db.prepare('SELECT * FROM karyawan WHERE id = ?').get(result.lastInsertRowid);
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

router.put('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = db.prepare(`SELECT id FROM karyawan WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });

    let data = pickFields(req.body);
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
    res.json(updated);
  } catch (err) {
    handleDbError(err, res);
  }
});

router.delete('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = db.prepare(`SELECT id FROM karyawan WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });

    const del = softDeleteParams(userId);
    db.prepare(
      `UPDATE karyawan SET deleted_by = ?, deleted_at = ?, updated_by = ?, updated_at = ? WHERE id = ?`
    ).run(del.deleted_by, del.deleted_at, userId, del.deleted_at, req.params.id);

    res.json({ message: 'Karyawan berhasil dihapus' });
  } catch (err) {
    handleDbError(err, res);
  }
});

export default router;
