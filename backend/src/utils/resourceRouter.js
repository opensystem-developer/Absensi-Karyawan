import { Router } from 'express';
import db from '../db.js';
import {
  getUserId, withAuditOnCreate, withAuditOnUpdate, softDeleteParams,
  NOT_DELETED, handleDbError, ensureEmployee, toBool,
} from '../utils/audit.js';

export function createEmployeeResourceRouter(config) {
  const {
    tableName,
    fields,
    required = [],
    validate,
    hasPrimary = false,
    orderBy = 'created_at DESC',
    entityName = 'Data',
    transformResponse = (row) => row,
    transformInput,
  } = config;

  const router = Router({ mergeParams: true });

  function pickFields(body) {
    const data = {};
    for (const field of fields) {
      if (body[field] !== undefined) {
        data[field] = body[field] === '' ? null : body[field];
      }
    }
    if (data.is_primary !== undefined && data.is_primary !== null) {
      data.is_primary = toBool(data.is_primary) ? 1 : 0;
    }
    if (data.tahun_lulus !== undefined && data.tahun_lulus !== null) {
      data.tahun_lulus = parseInt(data.tahun_lulus, 10) || null;
    }
    return transformInput ? transformInput(data) : data;
  }

  function clearPrimary(employeeId, exceptId = null) {
    if (!hasPrimary) return;
    if (exceptId) {
      db.prepare(`UPDATE ${tableName} SET is_primary = 0 WHERE employee_id = ? AND id != ? AND ${NOT_DELETED}`)
        .run(employeeId, exceptId);
    } else {
      db.prepare(`UPDATE ${tableName} SET is_primary = 0 WHERE employee_id = ? AND ${NOT_DELETED}`)
        .run(employeeId);
    }
  }

  function findActive(id, employeeId) {
    return db.prepare(
      `SELECT * FROM ${tableName} WHERE id = ? AND employee_id = ? AND ${NOT_DELETED}`
    ).get(id, employeeId);
  }

  router.get('/', (req, res) => {
    try {
      const employeeId = req.params.employeeId;
      if (!ensureEmployee(db, employeeId)) {
        return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
      }
      const rows = db.prepare(
        `SELECT * FROM ${tableName} WHERE employee_id = ? AND ${NOT_DELETED} ORDER BY ${orderBy}`
      ).all(employeeId);
      res.json(rows.map((r) => transformResponse(r)));
    } catch (err) {
      handleDbError(err, res);
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const row = findActive(req.params.id, req.params.employeeId);
      if (!row) return res.status(404).json({ error: `${entityName} tidak ditemukan` });
      res.json(transformResponse(row));
    } catch (err) {
      handleDbError(err, res);
    }
  });

  router.post('/', (req, res) => {
    try {
      const employeeId = req.params.employeeId;
      const userId = getUserId(req);
      if (!ensureEmployee(db, employeeId)) {
        return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
      }

      let data = pickFields(req.body);
      for (const field of required) {
        if (!data[field]) {
          return res.status(400).json({ error: `${field} wajib diisi` });
        }
      }
      if (validate) {
        const errMsg = validate(data);
        if (errMsg) return res.status(400).json({ error: errMsg });
      }

      data.employee_id = parseInt(employeeId, 10);
      if (hasPrimary && data.is_primary === undefined) data.is_primary = 0;

      if (hasPrimary) {
        const count = db.prepare(
          `SELECT COUNT(*) as count FROM ${tableName} WHERE employee_id = ? AND ${NOT_DELETED}`
        ).get(employeeId).count;
        if (count === 0) data.is_primary = 1;
      }

      data = withAuditOnCreate(data, userId);

      const insert = db.transaction(() => {
        if (hasPrimary && data.is_primary) clearPrimary(employeeId);
        const cols = Object.keys(data);
        const result = db.prepare(
          `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
        ).run(...cols.map((c) => data[c]));
        return db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(result.lastInsertRowid);
      });

      res.status(201).json(transformResponse(insert()));
    } catch (err) {
      handleDbError(err, res);
    }
  });

  router.put('/:id', (req, res) => {
    try {
      const employeeId = req.params.employeeId;
      const userId = getUserId(req);
      const existing = findActive(req.params.id, employeeId);
      if (!existing) return res.status(404).json({ error: `${entityName} tidak ditemukan` });

      let data = pickFields(req.body);
      if (validate) {
        const errMsg = validate(data, true);
        if (errMsg) return res.status(400).json({ error: errMsg });
      }
      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'Tidak ada data untuk diperbarui' });
      }

      data = withAuditOnUpdate(data, userId);

      const update = db.transaction(() => {
        if (hasPrimary && data.is_primary) clearPrimary(employeeId, req.params.id);
        const sets = Object.keys(data).map((k) => `${k} = ?`).join(', ');
        db.prepare(`UPDATE ${tableName} SET ${sets} WHERE id = ? AND employee_id = ?`)
          .run(...Object.values(data), req.params.id, employeeId);
        return db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id);
      });

      res.json(transformResponse(update()));
    } catch (err) {
      handleDbError(err, res);
    }
  });

  router.delete('/:id', (req, res) => {
    try {
      const employeeId = req.params.employeeId;
      const userId = getUserId(req);
      const existing = findActive(req.params.id, employeeId);
      if (!existing) return res.status(404).json({ error: `${entityName} tidak ditemukan` });

      const del = softDeleteParams(userId);

      db.transaction(() => {
        db.prepare(
          `UPDATE ${tableName} SET deleted_by = ?, deleted_at = ?, updated_by = ?, updated_at = ? WHERE id = ? AND employee_id = ?`
        ).run(del.deleted_by, del.deleted_at, userId, del.deleted_at, req.params.id, employeeId);

        if (hasPrimary && existing.is_primary) {
          const next = db.prepare(
            `SELECT id FROM ${tableName} WHERE employee_id = ? AND ${NOT_DELETED} ORDER BY created_at ASC LIMIT 1`
          ).get(employeeId);
          if (next) {
            db.prepare(`UPDATE ${tableName} SET is_primary = 1, updated_by = ?, updated_at = ? WHERE id = ?`)
              .run(userId, del.deleted_at, next.id);
          }
        }
      })();

      res.json({ message: `${entityName} berhasil dihapus` });
    } catch (err) {
      handleDbError(err, res);
    }
  });

  return router;
}
