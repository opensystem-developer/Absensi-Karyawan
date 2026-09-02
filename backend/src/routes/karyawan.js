import { Router } from 'express';
import db from '../db.js';

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

function handleDbError(err, res) {
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    const msg = err.message.includes('employee_no')
      ? 'Nomor karyawan sudah terdaftar'
      : err.message.includes('nik')
        ? 'NIK sudah terdaftar'
        : 'Data duplikat ditemukan';
    return res.status(409).json({ error: msg });
  }
  console.error(err);
  return res.status(500).json({ error: 'Terjadi kesalahan server' });
}

router.get('/', (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = 'SELECT * FROM karyawan WHERE 1=1';
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

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM karyawan WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    res.json(row);
  } catch (err) {
    handleDbError(err, res);
  }
});

router.post('/', (req, res) => {
  try {
    const data = pickFields(req.body);
    if (!data.employee_no || !data.nik || !data.nama_lengkap) {
      return res.status(400).json({ error: 'employee_no, nik, dan nama_lengkap wajib diisi' });
    }

    const cols = Object.keys(data);
    const placeholders = cols.map(() => '?').join(', ');
    const stmt = db.prepare(
      `INSERT INTO karyawan (${cols.join(', ')}) VALUES (${placeholders})`
    );
    const result = stmt.run(...cols.map((c) => data[c]));
    const created = db.prepare('SELECT * FROM karyawan WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    handleDbError(err, res);
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM karyawan WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });

    const data = pickFields(req.body);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Tidak ada data untuk diperbarui' });
    }

    data.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
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
    const result = db.prepare('DELETE FROM karyawan WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    res.json({ message: 'Karyawan berhasil dihapus' });
  } catch (err) {
    handleDbError(err, res);
  }
});

export default router;
