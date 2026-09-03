import { Router } from 'express';
import db from '../db.js';
import {
  getUserId, withAuditOnCreate, withAuditOnUpdate, softDeleteParams,
  NOT_DELETED, handleDbError,
} from '../utils/audit.js';
import { logActivity } from '../utils/logging.js';
import {
  enrichDepartment, listDepartments, setDepartmentBranches,
  validateDepartmentInput, normalizeDepartmentInput, SCOPE_ALL,
} from '../utils/departments.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const branchId = req.query.branch_id ? parseInt(req.query.branch_id, 10) : null;
    res.json(listDepartments(db, { branchId }));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM departments WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Departemen tidak ditemukan' });
    res.json(enrichDepartment(db, row));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.post('/', (req, res) => {
  try {
    const userId = getUserId(req);
    const data = normalizeDepartmentInput(req.body);
    const msg = validateDepartmentInput(data);
    if (msg) return res.status(400).json({ error: msg });

    const existing = db.prepare(`SELECT id FROM departments WHERE code = ? AND ${NOT_DELETED}`).get(data.code);
    if (existing) return res.status(409).json({ error: 'Kode departemen sudah digunakan' });

    const payload = withAuditOnCreate({
      code: data.code,
      name: data.name,
      scope: data.scope,
      status: data.status,
    }, userId);

    const cols = Object.keys(payload);
    const result = db.prepare(
      `INSERT INTO departments (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
    ).run(...cols.map((c) => payload[c]));

    const id = result.lastInsertRowid;
    if (data.scope !== SCOPE_ALL) setDepartmentBranches(db, id, data.branch_ids);

    const created = enrichDepartment(db, db.prepare('SELECT * FROM departments WHERE id = ?').get(id));
    logActivity({ userId: req.user?.id, username: userId, action: 'CREATE', module: 'departments', entityId: id, description: 'Tambah Departemen', ip: req.ip });
    res.status(201).json(created);
  } catch (err) {
    handleDbError(err, res);
  }
});

router.put('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const old = db.prepare(`SELECT * FROM departments WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!old) return res.status(404).json({ error: 'Departemen tidak ditemukan' });

    const data = normalizeDepartmentInput(req.body);
    const msg = validateDepartmentInput(data, true);
    if (msg) return res.status(400).json({ error: msg });

    const dup = db.prepare(`SELECT id FROM departments WHERE code = ? AND id != ? AND ${NOT_DELETED}`).get(data.code, req.params.id);
    if (dup) return res.status(409).json({ error: 'Kode departemen sudah digunakan' });

    const payload = withAuditOnUpdate({
      code: data.code,
      name: data.name,
      scope: data.scope,
      status: data.status,
    }, userId);

    const sets = Object.keys(payload).map((k) => `${k} = ?`).join(', ');
    db.prepare(`UPDATE departments SET ${sets} WHERE id = ?`).run(...Object.values(payload), req.params.id);

    if (data.scope === SCOPE_ALL) {
      db.prepare('DELETE FROM department_branches WHERE department_id = ?').run(req.params.id);
    } else {
      setDepartmentBranches(db, req.params.id, data.branch_ids);
    }

    const updated = enrichDepartment(db, db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id));
    logActivity({ userId: req.user?.id, username: userId, action: 'UPDATE', module: 'departments', entityId: updated.id, description: 'Ubah Departemen', ip: req.ip });
    res.json(updated);
  } catch (err) {
    handleDbError(err, res);
  }
});

router.delete('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = db.prepare(`SELECT * FROM departments WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Departemen tidak ditemukan' });

    const del = softDeleteParams(userId);
    db.prepare(`UPDATE departments SET deleted_by=?, deleted_at=?, updated_by=?, updated_at=? WHERE id=?`)
      .run(del.deleted_by, del.deleted_at, userId, del.deleted_at, req.params.id);

    logActivity({ userId: req.user?.id, username: userId, action: 'DELETE', module: 'departments', entityId: existing.id, description: 'Hapus Departemen', ip: req.ip });
    res.json({ message: 'Departemen berhasil dihapus' });
  } catch (err) {
    handleDbError(err, res);
  }
});

export default router;
