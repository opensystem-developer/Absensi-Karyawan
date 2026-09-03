import db from '../db.js';
import { NOT_DELETED } from './audit.js';

export const WORK_SCHEDULE_STATUSES = ['WORK', 'OFF', 'LEAVE', 'HOLIDAY'];
export const ATTENDANCE_STATUSES = ['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'OFF'];

export function getShift(db, shiftId) {
  if (!shiftId) return null;
  return db.prepare(`SELECT * FROM shifts WHERE id = ? AND ${NOT_DELETED}`).get(shiftId);
}

export function enrichShiftRow(row) {
  if (!row) return row;
  return { ...row, status: !!row.status };
}

export function enrichEmployeeShiftRow(row) {
  if (!row) return row;
  const shift = getShift(db, row.shift_id);
  return {
    ...row,
    shift_code: shift?.code,
    shift_name: shift?.name,
    shift_start: shift?.start_time,
    shift_end: shift?.end_time,
  };
}

export function enrichWorkScheduleRow(row) {
  if (!row) return row;
  const shift = getShift(db, row.shift_id);
  return {
    ...row,
    shift_code: shift?.code,
    shift_name: shift?.name,
    shift_start: shift?.start_time,
    shift_end: shift?.end_time,
  };
}

export function enrichAttendanceRow(row) {
  if (!row) return row;
  const shift = row.schedule_id
    ? db.prepare(`
        SELECT ws.*, s.code AS shift_code, s.name AS shift_name
        FROM work_schedules ws
        LEFT JOIN shifts s ON s.id = ws.shift_id
        WHERE ws.id = ? AND ws.deleted_at IS NULL
      `).get(row.schedule_id)
    : null;
  return {
    ...row,
    anomaly_flag: !!row.anomaly_flag,
    schedule_shift_code: shift?.shift_code,
    schedule_shift_name: shift?.shift_name,
    schedule_status: shift?.status,
  };
}

export function parseIntFields(data, fields) {
  for (const f of fields) {
    if (data[f] !== undefined && data[f] !== null && data[f] !== '') {
      data[f] = parseInt(data[f], 10);
    } else if (data[f] === '') {
      data[f] = null;
    }
  }
  return data;
}

export function listWorkSchedulesGlobal(db, { employeeId, dateFrom, dateTo } = {}) {
  let sql = `
    SELECT ws.*, k.nama_lengkap AS employee_name, k.employee_no
    FROM work_schedules ws
    JOIN karyawan k ON k.id = ws.employee_id AND k.deleted_at IS NULL
    WHERE ws.deleted_at IS NULL
  `;
  const params = [];
  if (employeeId) { sql += ' AND ws.employee_id = ?'; params.push(employeeId); }
  if (dateFrom) { sql += ' AND ws.work_date >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND ws.work_date <= ?'; params.push(dateTo); }
  sql += ' ORDER BY ws.work_date DESC, k.nama_lengkap ASC';
  return db.prepare(sql).all(...params).map(enrichWorkScheduleRow);
}

export function listAttendancesGlobal(db, { employeeId, dateFrom, dateTo, status } = {}) {
  let sql = `
    SELECT a.*, k.nama_lengkap AS employee_name, k.employee_no
    FROM attendances a
    JOIN karyawan k ON k.id = a.employee_id AND k.deleted_at IS NULL
    WHERE a.deleted_at IS NULL
  `;
  const params = [];
  if (employeeId) { sql += ' AND a.employee_id = ?'; params.push(employeeId); }
  if (dateFrom) { sql += ' AND a.work_date >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND a.work_date <= ?'; params.push(dateTo); }
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  sql += ' ORDER BY a.work_date DESC, k.nama_lengkap ASC';
  return db.prepare(sql).all(...params).map(enrichAttendanceRow);
}
