import { Router } from 'express';
import db from '../db.js';
import {
  getUserId, withAuditOnCreate, withAuditOnUpdate, softDeleteParams,
  NOT_DELETED, handleDbError, ensureEmployee,
} from '../utils/audit.js';
import { logActivity } from '../utils/logging.js';
import {
  enrichWorkScheduleRow, enrichAttendanceRow,
  listWorkSchedulesGlobal, listAttendancesGlobal,
  WORK_SCHEDULE_STATUSES, ATTENDANCE_STATUSES,
} from '../utils/shiftHelpers.js';
import { resolveBranchFilter } from '../utils/branchAccess.js';

const workSchedulesGlobalRouter = Router();
const attendancesGlobalRouter = Router();

function pickSchedule(body) {
  return {
    employee_id: body.employee_id ? parseInt(body.employee_id, 10) : null,
    work_date: body.work_date || null,
    shift_id: body.shift_id ? parseInt(body.shift_id, 10) : null,
    start_time: body.start_time || null,
    end_time: body.end_time || null,
    status: body.status || 'WORK',
  };
}

function pickAttendance(body) {
  return {
    employee_id: body.employee_id ? parseInt(body.employee_id, 10) : null,
    work_date: body.work_date || null,
    schedule_id: body.schedule_id ? parseInt(body.schedule_id, 10) : null,
    clock_in: body.clock_in || null,
    clock_out: body.clock_out || null,
    late_minutes: parseInt(body.late_minutes, 10) || 0,
    early_out_minutes: parseInt(body.early_out_minutes, 10) || 0,
    overtime_minutes: parseInt(body.overtime_minutes, 10) || 0,
    status: body.status || 'PRESENT',
    anomaly_flag: body.anomaly_flag ? 1 : 0,
    anomaly_reason: body.anomaly_reason || null,
  };
}

workSchedulesGlobalRouter.get('/', (req, res) => {
  try {
    const employeeId = req.query.employee_id ? parseInt(req.query.employee_id, 10) : null;
    const branchFilter = resolveBranchFilter(req, req.query.branch_id);
    if (branchFilter.error) return res.status(403).json({ error: branchFilter.error });

    res.json(listWorkSchedulesGlobal(db, {
      employeeId,
      dateFrom: req.query.work_date_from || null,
      dateTo: req.query.work_date_to || null,
      branchIds: branchFilter.branchIds,
    }));
  } catch (err) {
    handleDbError(err, res);
  }
});

workSchedulesGlobalRouter.post('/', (req, res) => {
  try {
    const userId = getUserId(req);
    const data = pickSchedule(req.body);
    if (!data.employee_id || !data.work_date || !data.shift_id) {
      return res.status(400).json({ error: 'employee_id, work_date, dan shift_id wajib diisi' });
    }
    if (!ensureEmployee(db, data.employee_id)) {
      return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    }
    if (!WORK_SCHEDULE_STATUSES.includes(data.status)) {
      return res.status(400).json({ error: 'Status jadwal tidak valid' });
    }
    const payload = withAuditOnCreate(data, userId);
    const cols = Object.keys(payload);
    const result = db.prepare(
      `INSERT INTO work_schedules (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
    ).run(...cols.map((c) => payload[c]));
    const created = enrichWorkScheduleRow(db.prepare('SELECT * FROM work_schedules WHERE id = ?').get(result.lastInsertRowid));
    logActivity({ userId: req.user?.id, username: userId, action: 'CREATE', module: 'work_schedules', entityId: created.id, description: 'Tambah jadwal kerja', ip: req.ip });
    res.status(201).json(created);
  } catch (err) {
    handleDbError(err, res);
  }
});

workSchedulesGlobalRouter.put('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const old = db.prepare(`SELECT * FROM work_schedules WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!old) return res.status(404).json({ error: 'Jadwal kerja tidak ditemukan' });

    const data = pickSchedule({ ...old, ...req.body });
    delete data.employee_id;
    const payload = withAuditOnUpdate({
      work_date: data.work_date,
      shift_id: data.shift_id,
      start_time: data.start_time,
      end_time: data.end_time,
      status: data.status,
    }, userId);
    const sets = Object.keys(payload).map((k) => `${k} = ?`).join(', ');
    db.prepare(`UPDATE work_schedules SET ${sets} WHERE id = ?`).run(...Object.values(payload), req.params.id);
    const updated = enrichWorkScheduleRow(db.prepare('SELECT * FROM work_schedules WHERE id = ?').get(req.params.id));
    logActivity({ userId: req.user?.id, username: userId, action: 'UPDATE', module: 'work_schedules', entityId: updated.id, description: 'Ubah jadwal kerja', ip: req.ip });
    res.json(updated);
  } catch (err) {
    handleDbError(err, res);
  }
});

workSchedulesGlobalRouter.delete('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = db.prepare(`SELECT * FROM work_schedules WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Jadwal kerja tidak ditemukan' });
    const del = softDeleteParams(userId);
    db.prepare(`UPDATE work_schedules SET deleted_by=?, deleted_at=?, updated_by=?, updated_at=? WHERE id=?`)
      .run(del.deleted_by, del.deleted_at, userId, del.deleted_at, req.params.id);
    res.json({ message: 'Jadwal kerja berhasil dihapus' });
  } catch (err) {
    handleDbError(err, res);
  }
});

attendancesGlobalRouter.get('/', (req, res) => {
  try {
    const employeeId = req.query.employee_id ? parseInt(req.query.employee_id, 10) : null;
    const branchFilter = resolveBranchFilter(req, req.query.branch_id);
    if (branchFilter.error) return res.status(403).json({ error: branchFilter.error });

    res.json(listAttendancesGlobal(db, {
      employeeId,
      dateFrom: req.query.work_date_from || null,
      dateTo: req.query.work_date_to || null,
      status: req.query.status || null,
      branchIds: branchFilter.branchIds,
    }));
  } catch (err) {
    handleDbError(err, res);
  }
});

attendancesGlobalRouter.post('/', (req, res) => {
  try {
    const userId = getUserId(req);
    const data = pickAttendance(req.body);
    if (!data.employee_id || !data.work_date) {
      return res.status(400).json({ error: 'employee_id dan work_date wajib diisi' });
    }
    if (!ensureEmployee(db, data.employee_id)) {
      return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    }
    if (!ATTENDANCE_STATUSES.includes(data.status)) {
      return res.status(400).json({ error: 'Status kehadiran tidak valid' });
    }
    const payload = withAuditOnCreate(data, userId);
    const cols = Object.keys(payload);
    const result = db.prepare(
      `INSERT INTO attendances (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
    ).run(...cols.map((c) => payload[c]));
    const created = enrichAttendanceRow(db.prepare('SELECT * FROM attendances WHERE id = ?').get(result.lastInsertRowid));
    logActivity({ userId: req.user?.id, username: userId, action: 'CREATE', module: 'attendances', entityId: created.id, description: 'Tambah kehadiran', ip: req.ip });
    res.status(201).json(created);
  } catch (err) {
    handleDbError(err, res);
  }
});

attendancesGlobalRouter.put('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const old = db.prepare(`SELECT * FROM attendances WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!old) return res.status(404).json({ error: 'Kehadiran tidak ditemukan' });

    const data = pickAttendance({ ...old, ...req.body });
    delete data.employee_id;
    const payload = withAuditOnUpdate({
      work_date: data.work_date,
      schedule_id: data.schedule_id,
      clock_in: data.clock_in,
      clock_out: data.clock_out,
      late_minutes: data.late_minutes,
      early_out_minutes: data.early_out_minutes,
      overtime_minutes: data.overtime_minutes,
      status: data.status,
      anomaly_flag: data.anomaly_flag,
      anomaly_reason: data.anomaly_reason,
    }, userId);
    const sets = Object.keys(payload).map((k) => `${k} = ?`).join(', ');
    db.prepare(`UPDATE attendances SET ${sets} WHERE id = ?`).run(...Object.values(payload), req.params.id);
    const updated = enrichAttendanceRow(db.prepare('SELECT * FROM attendances WHERE id = ?').get(req.params.id));
    logActivity({ userId: req.user?.id, username: userId, action: 'UPDATE', module: 'attendances', entityId: updated.id, description: 'Ubah kehadiran', ip: req.ip });
    res.json(updated);
  } catch (err) {
    handleDbError(err, res);
  }
});

attendancesGlobalRouter.delete('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = db.prepare(`SELECT * FROM attendances WHERE id = ? AND ${NOT_DELETED}`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Kehadiran tidak ditemukan' });
    const del = softDeleteParams(userId);
    db.prepare(`UPDATE attendances SET deleted_by=?, deleted_at=?, updated_by=?, updated_at=? WHERE id=?`)
      .run(del.deleted_by, del.deleted_at, userId, del.deleted_at, req.params.id);
    res.json({ message: 'Kehadiran berhasil dihapus' });
  } catch (err) {
    handleDbError(err, res);
  }
});

export { workSchedulesGlobalRouter, attendancesGlobalRouter };
