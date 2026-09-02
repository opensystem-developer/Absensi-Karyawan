import { Router } from 'express';
import db from '../db.js';
import {
  getUserId, withAuditOnCreate, withAuditOnUpdate, softDeleteParams,
  NOT_DELETED, handleDbError, toBool,
} from './audit.js';
import { logActivity } from './logging.js';

export function createMasterRouter(config) {
  const {
    tableName,
    fields,
    required = [],
    boolFields = [],
    entityName = 'Data',
    orderBy = 'id ASC',
    uniqueCheck,
    listQuery,
    validate,
    transformResponse = (r) => r,
    transformInput,
  } = config;

  const router = Router();

  function pick(body) {
    const data = {};
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f] === '' ? null : body[f];
    }
    for (const f of boolFields) {
      if (data[f] !== undefined && data[f] !== null) data[f] = toBool(data[f]) ? 1 : 0;
    }
    return transformInput ? transformInput(data) : data;
  }

  router.get('/', (req, res) => {
    try {
      let sql = `SELECT * FROM ${tableName} WHERE ${NOT_DELETED}`;
      const params = [];
      if (listQuery) {
        const extra = listQuery(req, params);
        if (extra) sql += extra;
      }
      sql += ` ORDER BY ${orderBy}`;
      res.json(db.prepare(sql).all(...params).map(transformResponse));
    } catch (err) {
      handleDbError(err, res);
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const row = db.prepare(`SELECT * FROM ${tableName} WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
      if (!row) return res.status(404).json({ error: `${entityName} tidak ditemukan` });
      res.json(transformResponse(row));
    } catch (err) {
      handleDbError(err, res);
    }
  });

  router.post('/', (req, res) => {
    try {
      const userId = req.user?.username || getUserId(req);
      let data = pick(req.body);
      for (const f of required) {
        if (!data[f] && data[f] !== 0) return res.status(400).json({ error: `${f} wajib diisi` });
      }
      if (validate) {
        const msg = validate(data);
        if (msg) return res.status(400).json({ error: msg });
      }
      if (uniqueCheck) {
        const msg = uniqueCheck(data);
        if (msg) return res.status(409).json({ error: msg });
      }
      data = withAuditOnCreate(data, userId);
      const cols = Object.keys(data);
      const result = db.prepare(
        `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
      ).run(...cols.map((c) => data[c]));
      const created = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(result.lastInsertRowid);
      logActivity({ userId: req.user?.id, username: userId, action: 'CREATE', module: tableName, entityId: created.id, description: `Tambah ${entityName}`, ip: req.ip });
      res.status(201).json(transformResponse(created));
    } catch (err) {
      handleDbError(err, res);
    }
  });

  router.put('/:id', (req, res) => {
    try {
      const userId = req.user?.username || getUserId(req);
      const old = db.prepare(`SELECT * FROM ${tableName} WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
      if (!old) return res.status(404).json({ error: `${entityName} tidak ditemukan` });

      let data = pick(req.body);
      if (validate) {
        const msg = validate(data, true);
        if (msg) return res.status(400).json({ error: msg });
      }
      if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Tidak ada data untuk diperbarui' });

      data = withAuditOnUpdate(data, userId);
      const sets = Object.keys(data).map((k) => `${k} = ?`).join(', ');
      db.prepare(`UPDATE ${tableName} SET ${sets} WHERE id = ?`).run(...Object.values(data), req.params.id);
      const updated = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id);

      if (config.onUpdate) config.onUpdate(old, updated, userId);
      logActivity({ userId: req.user?.id, username: userId, action: 'UPDATE', module: tableName, entityId: updated.id, description: `Ubah ${entityName}`, ip: req.ip });
      res.json(transformResponse(updated));
    } catch (err) {
      handleDbError(err, res);
    }
  });

  router.delete('/:id', (req, res) => {
    try {
      const userId = req.user?.username || getUserId(req);
      const existing = db.prepare(`SELECT * FROM ${tableName} WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
      if (!existing) return res.status(404).json({ error: `${entityName} tidak ditemukan` });

      const del = softDeleteParams(userId);
      db.prepare(`UPDATE ${tableName} SET deleted_by=?, deleted_at=?, updated_by=?, updated_at=? WHERE id=?`)
        .run(del.deleted_by, del.deleted_at, userId, del.deleted_at, req.params.id);

      logActivity({ userId: req.user?.id, username: userId, action: 'DELETE', module: tableName, entityId: existing.id, description: `Hapus ${entityName}`, ip: req.ip });
      res.json({ message: `${entityName} berhasil dihapus` });
    } catch (err) {
      handleDbError(err, res);
    }
  });

  return router;
}
