export function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export function getUserId(req) {
  return req?.user?.username || req.headers['x-user-id'] || req.body?._user || 'system';
}

export function withAuditOnCreate(data, userId) {
  const ts = now();
  return {
    ...data,
    created_by: userId,
    created_at: ts,
    updated_by: userId,
    updated_at: ts,
    deleted_by: null,
    deleted_at: null,
  };
}

export function withAuditOnUpdate(data, userId) {
  return {
    ...data,
    updated_by: userId,
    updated_at: now(),
  };
}

export function softDeleteParams(userId) {
  return { deleted_by: userId, deleted_at: now() };
}

export const NOT_DELETED = 'deleted_at IS NULL';

export function handleDbError(err, res, messages = {}) {
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(404).json({ error: messages.foreignKey || 'Data referensi tidak ditemukan' });
  }
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: messages.unique || 'Data duplikat ditemukan' });
  }
  if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
    return res.status(400).json({ error: messages.check || 'Data tidak valid' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Terjadi kesalahan server' });
}

export function ensureEmployee(db, employeeId) {
  return db.prepare(`SELECT id FROM karyawan WHERE id = ? AND ${NOT_DELETED}`).get(employeeId);
}

export function toBool(value) {
  return value === true || value === 1 || value === '1';
}
