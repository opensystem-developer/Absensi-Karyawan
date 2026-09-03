import { Router } from 'express';
import db from '../db.js';
import {
  getUserId, withAuditOnCreate, withAuditOnUpdate, softDeleteParams,
  NOT_DELETED, handleDbError, ensureEmployee,
} from '../utils/audit.js';
import { enrichEmployeeShiftRow } from '../utils/shiftHelpers.js';
import { generateMonthlyWorkSchedules } from '../utils/scheduleGenerator.js';
import { assertEmployeeBranchAccess } from '../utils/branchAccess.js';

const router = Router({ mergeParams: true });

const FIELDS = ['shift_id', 'effective_from', 'effective_to', 'monthly_off_days'];

function pickFields(body) {
  const data = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) data[field] = body[field] === '' ? null : body[field];
  }
  if (data.shift_id) data.shift_id = parseInt(data.shift_id, 10);
  if (data.monthly_off_days !== undefined && data.monthly_off_days !== null) {
    data.monthly_off_days = parseInt(data.monthly_off_days, 10) || 4;
  }
  return data;
}

function findActive(id, employeeId) {
  return db.prepare(
    `SELECT * FROM employee_shifts WHERE id = ? AND employee_id = ? AND ${NOT_DELETED}`
  ).get(id, employeeId);
}

router.get('/', (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    if (!ensureEmployee(db, employeeId)) {
      return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    }
    const rows = db.prepare(
      `SELECT * FROM employee_shifts WHERE employee_id = ? AND ${NOT_DELETED} ORDER BY effective_from DESC`
    ).all(employeeId);
    res.json(rows.map(enrichEmployeeShiftRow));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = findActive(req.params.id, req.params.employeeId);
    if (!row) return res.status(404).json({ error: 'Shift karyawan tidak ditemukan' });
    res.json(enrichEmployeeShiftRow(row));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.post('/', (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId, 10);
    const userId = getUserId(req);
    const access = assertEmployeeBranchAccess(db, req, employeeId);
    if (!access.ok) return res.status(access.status).json({ error: access.error });

    const data = pickFields(req.body);
    if (!data.shift_id || !data.effective_from) {
      return res.status(400).json({ error: 'shift_id dan effective_from wajib diisi' });
    }
    if (data.monthly_off_days === undefined || data.monthly_off_days === null) {
      data.monthly_off_days = 4;
    }

    data.employee_id = employeeId;
    const payload = withAuditOnCreate(data, userId);

    const created = db.transaction(() => {
      const cols = Object.keys(payload);
      const result = db.prepare(
        `INSERT INTO employee_shifts (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
      ).run(...cols.map((c) => payload[c]));
      return db.prepare('SELECT * FROM employee_shifts WHERE id = ?').get(result.lastInsertRowid);
    })();

    const schedulesGenerated = generateMonthlyWorkSchedules(db, {
      employeeId,
      shiftId: created.shift_id,
      effectiveFrom: created.effective_from,
      effectiveTo: created.effective_to,
      monthlyOffDays: created.monthly_off_days ?? 4,
      userId,
    });

    res.status(201).json({
      ...enrichEmployeeShiftRow(created),
      schedules_generated: schedulesGenerated,
    });
  } catch (err) {
    handleDbError(err, res);
  }
});

router.put('/:id', (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const userId = getUserId(req);
    const existing = findActive(req.params.id, employeeId);
    if (!existing) return res.status(404).json({ error: 'Shift karyawan tidak ditemukan' });

    const data = pickFields(req.body);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Tidak ada data untuk diperbarui' });
    }

    const payload = withAuditOnUpdate(data, userId);
    const sets = Object.keys(payload).map((k) => `${k} = ?`).join(', ');
    db.prepare(`UPDATE employee_shifts SET ${sets} WHERE id = ? AND employee_id = ?`)
      .run(...Object.values(payload), req.params.id, employeeId);

    const updated = db.prepare('SELECT * FROM employee_shifts WHERE id = ?').get(req.params.id);
    res.json(enrichEmployeeShiftRow(updated));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.delete('/:id', (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const userId = getUserId(req);
    const existing = findActive(req.params.id, employeeId);
    if (!existing) return res.status(404).json({ error: 'Shift karyawan tidak ditemukan' });

    const del = softDeleteParams(userId);
    db.prepare(
      `UPDATE employee_shifts SET deleted_by = ?, deleted_at = ?, updated_by = ?, updated_at = ? WHERE id = ? AND employee_id = ?`
    ).run(del.deleted_by, del.deleted_at, userId, del.deleted_at, req.params.id, employeeId);

    res.json({ message: 'Shift karyawan berhasil dihapus' });
  } catch (err) {
    handleDbError(err, res);
  }
});

export default router;
