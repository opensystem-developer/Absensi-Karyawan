import { Router } from 'express';
import db from '../db.js';

const router = Router({ mergeParams: true });

const FIELDS = [
  'type', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan',
  'kota', 'provinsi', 'kode_pos', 'is_primary',
];

function pickFields(body) {
  const data = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field] === '' ? null : body[field];
    }
  }
  if (data.is_primary !== undefined && data.is_primary !== null) {
    data.is_primary = data.is_primary === true || data.is_primary === 1 || data.is_primary === '1' ? 1 : 0;
  }
  return data;
}

function ensureEmployee(employeeId) {
  return db.prepare('SELECT id FROM karyawan WHERE id = ?').get(employeeId);
}

function clearPrimary(employeeId, exceptId = null) {
  if (exceptId) {
    db.prepare('UPDATE alamat_karyawan SET is_primary = 0 WHERE employee_id = ? AND id != ?')
      .run(employeeId, exceptId);
  } else {
    db.prepare('UPDATE alamat_karyawan SET is_primary = 0 WHERE employee_id = ?').run(employeeId);
  }
}

function toResponse(row) {
  if (!row) return row;
  return { ...row, is_primary: !!row.is_primary };
}

function handleDbError(err, res) {
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
  }
  if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
    return res.status(400).json({ error: 'Tipe alamat harus KTP atau DOMISILI' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Terjadi kesalahan server' });
}

router.get('/', (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    if (!ensureEmployee(employeeId)) {
      return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    }
    const rows = db.prepare(
      'SELECT * FROM alamat_karyawan WHERE employee_id = ? ORDER BY is_primary DESC, type ASC'
    ).all(employeeId);
    res.json(rows.map(toResponse));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(
      'SELECT * FROM alamat_karyawan WHERE id = ? AND employee_id = ?'
    ).get(req.params.id, req.params.employeeId);
    if (!row) return res.status(404).json({ error: 'Alamat tidak ditemukan' });
    res.json(toResponse(row));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.post('/', (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    if (!ensureEmployee(employeeId)) {
      return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    }

    const data = pickFields(req.body);
    if (!data.type || !data.alamat) {
      return res.status(400).json({ error: 'type dan alamat wajib diisi' });
    }
    if (!['KTP', 'DOMISILI'].includes(data.type)) {
      return res.status(400).json({ error: 'Tipe alamat harus KTP atau DOMISILI' });
    }

    data.employee_id = parseInt(employeeId, 10);
    if (data.is_primary === undefined) data.is_primary = 0;

    const existingCount = db.prepare(
      'SELECT COUNT(*) as count FROM alamat_karyawan WHERE employee_id = ?'
    ).get(employeeId).count;
    if (existingCount === 0) data.is_primary = 1;

    const insert = db.transaction(() => {
      if (data.is_primary) clearPrimary(employeeId);
      const cols = Object.keys(data);
      const placeholders = cols.map(() => '?').join(', ');
      const result = db.prepare(
        `INSERT INTO alamat_karyawan (${cols.join(', ')}) VALUES (${placeholders})`
      ).run(...cols.map((c) => data[c]));
      return db.prepare('SELECT * FROM alamat_karyawan WHERE id = ?').get(result.lastInsertRowid);
    });

    res.status(201).json(toResponse(insert()));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.put('/:id', (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const existing = db.prepare(
      'SELECT * FROM alamat_karyawan WHERE id = ? AND employee_id = ?'
    ).get(req.params.id, employeeId);
    if (!existing) return res.status(404).json({ error: 'Alamat tidak ditemukan' });

    const data = pickFields(req.body);
    if (data.type && !['KTP', 'DOMISILI'].includes(data.type)) {
      return res.status(400).json({ error: 'Tipe alamat harus KTP atau DOMISILI' });
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Tidak ada data untuk diperbarui' });
    }

    data.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const update = db.transaction(() => {
      if (data.is_primary) clearPrimary(employeeId, req.params.id);
      const sets = Object.keys(data).map((k) => `${k} = ?`).join(', ');
      db.prepare(`UPDATE alamat_karyawan SET ${sets} WHERE id = ? AND employee_id = ?`)
        .run(...Object.values(data), req.params.id, employeeId);
      return db.prepare('SELECT * FROM alamat_karyawan WHERE id = ?').get(req.params.id);
    });

    res.json(toResponse(update()));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.delete('/:id', (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const existing = db.prepare(
      'SELECT * FROM alamat_karyawan WHERE id = ? AND employee_id = ?'
    ).get(req.params.id, employeeId);
    if (!existing) return res.status(404).json({ error: 'Alamat tidak ditemukan' });

    db.transaction(() => {
      db.prepare('DELETE FROM alamat_karyawan WHERE id = ? AND employee_id = ?')
        .run(req.params.id, employeeId);
      if (existing.is_primary) {
        const next = db.prepare(
          'SELECT id FROM alamat_karyawan WHERE employee_id = ? ORDER BY created_at ASC LIMIT 1'
        ).get(employeeId);
        if (next) {
          db.prepare('UPDATE alamat_karyawan SET is_primary = 1 WHERE id = ?').run(next.id);
        }
      }
    })();

    res.json({ message: 'Alamat berhasil dihapus' });
  } catch (err) {
    handleDbError(err, res);
  }
});

export default router;
