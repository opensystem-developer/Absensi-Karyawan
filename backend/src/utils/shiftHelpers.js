import db from '../db.js';
import { NOT_DELETED } from './audit.js';
import { enrichShiftColorFields } from './colorUtils.js';

export const WORK_SCHEDULE_STATUSES = ['WORK', 'OFF', 'LEAVE', 'HOLIDAY'];
export const ATTENDANCE_STATUSES = ['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'OFF'];

export function getShift(db, shiftId) {
  if (!shiftId) return null;
  return db.prepare(`SELECT * FROM shifts WHERE id = ? AND ${NOT_DELETED}`).get(shiftId);
}

export function enrichShiftRow(row) {
  if (!row) return row;
  return enrichShiftColorFields({ ...row, status: !!row.status });
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

const POSITION_SUBQUERY_CODE = `
  (
    SELECT p.code
    FROM employee_positions ep
    JOIN positions p ON p.id = ep.position_id AND p.deleted_at IS NULL
    WHERE ep.employee_id = k.id AND ep.deleted_at IS NULL
    ORDER BY ep.is_current DESC, ep.start_date DESC
    LIMIT 1
  )`;

const POSITION_SUBQUERY_NAME = `
  (
    SELECT p.name
    FROM employee_positions ep
    JOIN positions p ON p.id = ep.position_id AND p.deleted_at IS NULL
    WHERE ep.employee_id = k.id AND ep.deleted_at IS NULL
    ORDER BY ep.is_current DESC, ep.start_date DESC
    LIMIT 1
  )`;

export function listWorkSchedulesGlobal(db, { employeeId, dateFrom, dateTo, branchIds = null } = {}) {
  if (branchIds !== null && branchIds.length === 0) return [];

  let sql = `
    SELECT ws.*, k.nama_lengkap AS employee_name, k.employee_no, k.branch_id,
      b.code AS branch_code, b.name AS branch_name,
      ${POSITION_SUBQUERY_CODE} AS position_code,
      ${POSITION_SUBQUERY_NAME} AS position_name
    FROM work_schedules ws
    JOIN karyawan k ON k.id = ws.employee_id AND k.deleted_at IS NULL
    LEFT JOIN branches b ON b.id = k.branch_id AND b.deleted_at IS NULL
    WHERE ws.deleted_at IS NULL
  `;
  const params = [];
  if (employeeId) { sql += ' AND ws.employee_id = ?'; params.push(employeeId); }
  if (dateFrom) { sql += ' AND ws.work_date >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND ws.work_date <= ?'; params.push(dateTo); }
  if (branchIds !== null) {
    sql += ` AND k.branch_id IN (${branchIds.map(() => '?').join(',')})`;
    params.push(...branchIds);
  }
  sql += ' ORDER BY ws.work_date DESC, k.nama_lengkap ASC';
  return db.prepare(sql).all(...params).map(enrichWorkScheduleRow);
}

export function listAttendancesGlobal(db, { employeeId, dateFrom, dateTo, status, branchIds = null } = {}) {
  if (branchIds !== null && branchIds.length === 0) return [];

  let sql = `
    SELECT a.*, k.nama_lengkap AS employee_name, k.employee_no, k.branch_id,
      b.code AS branch_code, b.name AS branch_name,
      ${POSITION_SUBQUERY_CODE} AS position_code,
      ${POSITION_SUBQUERY_NAME} AS position_name
    FROM attendances a
    JOIN karyawan k ON k.id = a.employee_id AND k.deleted_at IS NULL
    LEFT JOIN branches b ON b.id = k.branch_id AND b.deleted_at IS NULL
    WHERE a.deleted_at IS NULL
  `;
  const params = [];
  if (employeeId) { sql += ' AND a.employee_id = ?'; params.push(employeeId); }
  if (dateFrom) { sql += ' AND a.work_date >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND a.work_date <= ?'; params.push(dateTo); }
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  if (branchIds !== null) {
    sql += ` AND k.branch_id IN (${branchIds.map(() => '?').join(',')})`;
    params.push(...branchIds);
  }
  sql += ' ORDER BY a.work_date DESC, k.nama_lengkap ASC';
  return db.prepare(sql).all(...params).map(enrichAttendanceRow);
}
