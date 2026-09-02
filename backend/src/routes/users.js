import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { getUserId, withAuditOnCreate, withAuditOnUpdate, softDeleteParams, NOT_DELETED, handleDbError } from '../utils/audit.js';
import { parsePermissions } from '../middleware/auth.js';

const router = Router();

router.get('/roles', (_req, res) => {
  const rows = db.prepare(`SELECT id, code, name, permissions FROM roles WHERE ${NOT_DELETED} ORDER BY name`).all();
  res.json(rows.map((r) => ({ ...r, permissions: parsePermissions(r.permissions) })));
});

router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.role_id, u.is_active, r.code as role_code, r.name as role_name,
             u.created_at, u.updated_at
      FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.deleted_at IS NULL ORDER BY u.username
    `).all();
    res.json(rows.map((r) => ({ ...r, is_active: !!r.is_active })));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.post('/', (req, res) => {
  try {
    const userId = getUserId(req);
    const { username, password, full_name, role_id, is_active = true } = req.body;
    if (!username || !password || !full_name || !role_id) {
      return res.status(400).json({ error: 'username, password, full_name, role_id wajib diisi' });
    }
    const data = withAuditOnCreate({
      username, password_hash: bcrypt.hashSync(password, 10), full_name, role_id: parseInt(role_id, 10), is_active: is_active ? 1 : 0,
    }, userId);
    const cols = Object.keys(data);
    const result = db.prepare(`INSERT INTO users (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...cols.map((c) => data[c]));
    res.status(201).json({ id: result.lastInsertRowid, username, full_name, role_id });
  } catch (err) {
    handleDbError(err, res);
  }
});

router.put('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = db.prepare(`SELECT * FROM users WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'User tidak ditemukan' });

    const updates = {};
    if (req.body.full_name) updates.full_name = req.body.full_name;
    if (req.body.role_id) updates.role_id = parseInt(req.body.role_id, 10);
    if (req.body.is_active !== undefined) updates.is_active = req.body.is_active ? 1 : 0;
    if (req.body.password) updates.password_hash = bcrypt.hashSync(req.body.password, 10);

    Object.assign(updates, withAuditOnUpdate({}, userId));
    const sets = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
    db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...Object.values(updates), req.params.id);
    res.json({ message: 'User berhasil diperbarui' });
  } catch (err) {
    handleDbError(err, res);
  }
});

router.delete('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    if (parseInt(req.params.id, 10) === req.user?.id) return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri' });
    const del = softDeleteParams(userId);
    const result = db.prepare(`UPDATE users SET deleted_by=?, deleted_at=?, updated_by=?, updated_at=? WHERE id=? AND deleted_at IS NULL`)
      .run(del.deleted_by, del.deleted_at, userId, del.deleted_at, req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    handleDbError(err, res);
  }
});

export default router;
