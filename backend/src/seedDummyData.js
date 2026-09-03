import { withAuditOnCreate } from './utils/audit.js';
import { defaultShiftColorForCode } from './utils/colorUtils.js';
import { generateMonthlyWorkSchedules } from './utils/scheduleGenerator.js';
import { generateEmployeeNo } from './utils/employeeNo.js';

const USER = 'system';

/** Definisi shift lengkap untuk demo. */
const SHIFT_DEFS = [
  { code: 'PG', name: 'Pagi', start: '08:00', end: '17:00', breakStart: '12:00', breakEnd: '13:00', late: 15, early: 15 },
  { code: 'SG', name: 'Siang', start: '12:00', end: '21:00', breakStart: '16:00', breakEnd: '17:00', late: 10, early: 10 },
  { code: 'PAGI', name: 'Shift Pagi', start: '08:00', end: '17:00', breakStart: '12:00', breakEnd: '13:00', late: 15, early: 15 },
  { code: 'SIANG', name: 'Shift Siang', start: '12:00', end: '21:00', breakStart: '16:00', breakEnd: '17:00', late: 10, early: 10 },
  { code: 'SORE', name: 'Shift Sore', start: '14:00', end: '22:00', breakStart: '18:00', breakEnd: '19:00', late: 10, early: 10 },
  { code: 'MALAM', name: 'Shift Malam', start: '22:00', end: '06:00', breakStart: '01:00', breakEnd: '02:00', late: 10, early: 10 },
  { code: 'FLEX', name: 'Shift Fleksibel', start: '09:00', end: '18:00', breakStart: '12:30', breakEnd: '13:30', late: 15, early: 15 },
  { code: 'MID', name: 'Shift Tengah', start: '10:00', end: '19:00', breakStart: '14:00', breakEnd: '15:00', late: 10, early: 10 },
  { code: 'SPL', name: 'Shift Split', start: '07:00', end: '19:00', breakStart: '11:00', breakEnd: '15:00', late: 10, early: 10 },
  { code: 'HS', name: 'Shift Half Day', start: '08:00', end: '12:00', breakStart: null, breakEnd: null, late: 5, early: 5 },
  { code: 'OJT', name: 'Shift Magang', start: '08:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00', late: 15, early: 15 },
];

/** Jabatan per departemen (code departemen). */
const POSITIONS_BY_DEPT = {
  IT: [
    { code: 'IT-MGR', name: 'Manager IT', level: 'Manager' },
    { code: 'DEV', name: 'Software Developer', level: 'Staff' },
    { code: 'SR-DEV', name: 'Senior Developer', level: 'Senior' },
    { code: 'QA', name: 'Quality Assurance', level: 'Staff' },
    { code: 'SYSADMIN', name: 'System Administrator', level: 'Staff' },
    { code: 'HELPDESK', name: 'IT Support', level: 'Staff' },
  ],
  KASIR: [
    { code: 'HEAD-KSR', name: 'Kepala Kasir', level: 'Supervisor' },
    { code: 'SPV-KSR', name: 'Supervisor Kasir', level: 'Supervisor' },
    { code: 'KSR-A', name: 'Kasir A', level: 'Staff' },
    { code: 'KSR-B', name: 'Kasir B', level: 'Staff' },
    { code: 'KSR-C', name: 'Kasir C', level: 'Staff' },
    { code: 'KSR-D', name: 'Kasir D', level: 'Staff' },
  ],
  HR: [
    { code: 'HR-MGR', name: 'HR Manager', level: 'Manager' },
    { code: 'HR-STAFF', name: 'Staff HR', level: 'Staff' },
    { code: 'RECRUITER', name: 'Recruiter', level: 'Staff' },
    { code: 'TRAINING', name: 'Training Specialist', level: 'Staff' },
    { code: 'HR-ADMIN', name: 'HR Administrator', level: 'Staff' },
  ],
  FIN: [
    { code: 'FIN-MGR', name: 'Finance Manager', level: 'Manager' },
    { code: 'ACCOUNTANT', name: 'Akuntan', level: 'Staff' },
    { code: 'TAX', name: 'Spesialis Pajak', level: 'Staff' },
    { code: 'CASH-FIN', name: 'Kasir Keuangan', level: 'Staff' },
    { code: 'AUDITOR', name: 'Internal Auditor', level: 'Senior' },
  ],
  OPS: [
    { code: 'OPS-MGR', name: 'Manager Operasional', level: 'Manager' },
    { code: 'OPS-SPV', name: 'Supervisor Operasional', level: 'Supervisor' },
    { code: 'OPS-STAFF', name: 'Staff Operasional', level: 'Staff' },
    { code: 'DRIVER', name: 'Driver', level: 'Staff' },
  ],
  GUDANG: [
    { code: 'WH-MGR', name: 'Kepala Gudang', level: 'Manager' },
    { code: 'WH-SPV', name: 'Supervisor Gudang', level: 'Supervisor' },
    { code: 'WH-STAFF', name: 'Staff Gudang', level: 'Staff' },
    { code: 'PICKER', name: 'Picker', level: 'Staff' },
  ],
  CS: [
    { code: 'CS-MGR', name: 'Manager Customer Service', level: 'Manager' },
    { code: 'CS-LEAD', name: 'Team Lead CS', level: 'Supervisor' },
    { code: 'CS-STAFF', name: 'Staff Customer Service', level: 'Staff' },
  ],
  PROD: [
    { code: 'PROD-MGR', name: 'Manager Produksi', level: 'Manager' },
    { code: 'PROD-SPV', name: 'Supervisor Produksi', level: 'Supervisor' },
    { code: 'PROD-OP', name: 'Operator Produksi', level: 'Staff' },
    { code: 'QC', name: 'Quality Control', level: 'Staff' },
  ],
  MKT: [
    { code: 'MKT-MGR', name: 'Marketing Manager', level: 'Manager' },
    { code: 'MKT-STAFF', name: 'Staff Marketing', level: 'Staff' },
    { code: 'DESIGN', name: 'Desainer', level: 'Staff' },
    { code: 'SOCIAL', name: 'Social Media Specialist', level: 'Staff' },
  ],
};

const EXTRA_DEPARTMENTS = [
  { code: 'OPS', name: 'Operasional', scope: 'ALL', branches: [] },
  { code: 'GUDANG', name: 'Gudang', scope: 'ALL', branches: [] },
  { code: 'CS', name: 'Customer Service', scope: 'ALL', branches: [] },
  { code: 'PROD', name: 'Produksi', scope: 'ALL', branches: [] },
  { code: 'MKT', name: 'Marketing', scope: 'BRANCH', branches: ['OFFICE'] },
];

const DEFAULT_POSITIONS = [
  { code: 'MGR', name: 'Manager', level: 'Manager' },
  { code: 'SPV', name: 'Supervisor', level: 'Supervisor' },
  { code: 'STAFF', name: 'Staff', level: 'Staff' },
];

/** Karyawan dummy — branch code, dept code, position code, shift code, nama. */
const EMPLOYEE_DEFS = [
  { branch: 'OFFICE', dept: 'IT', position: 'DEV', shift: 'PG', name: 'Andi Wijaya', nik: '3174010101900001', gender: 'L' },
  { branch: 'OFFICE', dept: 'IT', position: 'QA', shift: 'PG', name: 'Dewi Lestari', nik: '3174020202900002', gender: 'P' },
  { branch: 'OFFICE', dept: 'HR', position: 'HR-STAFF', shift: 'PG', name: 'Rina Marlina', nik: '3174030303900003', gender: 'P' },
  { branch: 'OFFICE', dept: 'FIN', position: 'ACCOUNTANT', shift: 'PG', name: 'Hendra Gunawan', nik: '3174040404900004', gender: 'L' },
  { branch: 'BTN', dept: 'KASIR', position: 'HEAD-KSR', shift: 'PG', name: 'Siti Rahayu', nik: '3174050505900005', gender: 'P' },
  { branch: 'BTN', dept: 'KASIR', position: 'KSR-A', shift: 'PG', name: 'Budi Santoso', nik: '3174060606900006', gender: 'L' },
  { branch: 'BTN', dept: 'KASIR', position: 'KSR-B', shift: 'SG', name: 'Ayu Pratiwi', nik: '3174070707900007', gender: 'P' },
  { branch: 'PYU', dept: 'KASIR', position: 'KSR-A', shift: 'PG', name: 'Fajar Nugroho', nik: '3174080808900008', gender: 'L' },
  { branch: 'PYU', dept: 'KASIR', position: 'KSR-C', shift: 'SG', name: 'Maya Sari', nik: '3174090909900009', gender: 'P' },
  { branch: 'LMN', dept: 'KASIR', position: 'SPV-KSR', shift: 'PG', name: 'Rizky Hidayat', nik: '3174101010900010', gender: 'L' },
  { branch: 'LMN', dept: 'KASIR', position: 'KSR-D', shift: 'SORE', name: 'Putri Anggraini', nik: '3174111111900011', gender: 'P' },
  { branch: 'PRI', dept: 'KASIR', position: 'KSR-B', shift: 'PG', name: 'Agus Salim', nik: '3174121212900012', gender: 'L' },
  { branch: 'PRI', dept: 'KASIR', position: 'KSR-A', shift: 'SG', name: 'Lestari Wulandari', nik: '3174131313900013', gender: 'P' },
  { branch: 'OFFICE', dept: 'OPS', position: 'OPS-STAFF', shift: 'FLEX', name: 'Doni Prasetyo', nik: '3174141414900014', gender: 'L' },
  { branch: 'OFFICE', dept: 'GUDANG', position: 'WH-STAFF', shift: 'MID', name: 'Eko Saputra', nik: '3174151515900015', gender: 'L' },
  { branch: 'OFFICE', dept: 'CS', position: 'CS-STAFF', shift: 'PG', name: 'Fitri Handayani', nik: '3174161616900016', gender: 'P' },
  { branch: 'OFFICE', dept: 'MKT', position: 'MKT-STAFF', shift: 'FLEX', name: 'Gita Maharani', nik: '3174171717900017', gender: 'P' },
  { branch: 'BTN', dept: 'KASIR', position: 'KSR-C', shift: 'MALAM', name: 'Hadi Kurniawan', nik: '3174181818900018', gender: 'L' },
];

function getBranchMap(db) {
  const rows = db.prepare('SELECT id, code FROM branches WHERE deleted_at IS NULL').all();
  return Object.fromEntries(rows.map((r) => [r.code, r.id]));
}

function getDeptMap(db) {
  const rows = db.prepare('SELECT id, code FROM departments WHERE deleted_at IS NULL').all();
  return Object.fromEntries(rows.map((r) => [r.code, r.id]));
}

function getCompanyId(db) {
  const row = db.prepare('SELECT id FROM companies WHERE deleted_at IS NULL LIMIT 1').get();
  return row?.id;
}

function getEmploymentStatusId(db) {
  const row = db.prepare('SELECT id FROM employment_statuses WHERE deleted_at IS NULL ORDER BY id LIMIT 1').get();
  return row?.id;
}

function upsertShift(db, def) {
  const colors = defaultShiftColorForCode(def.code);
  const existing = db.prepare('SELECT id FROM shifts WHERE code = ? AND deleted_at IS NULL').get(def.code);
  if (existing) {
    db.prepare(`
      UPDATE shifts SET name = ?, start_time = ?, end_time = ?, break_start = ?, break_end = ?,
        late_tolerance_minutes = ?, early_out_tolerance_minutes = ?, status = 1,
        color_bg = COALESCE(color_bg, ?), color_fg = COALESCE(color_fg, ?), color_border = COALESCE(color_border, ?),
        updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      def.name, def.start, def.end, def.breakStart, def.breakEnd,
      def.late, def.early, colors.bg, colors.fg, colors.border, USER, existing.id,
    );
    return { id: existing.id, created: false };
  }

  const result = db.prepare(`
    INSERT INTO shifts (code, name, start_time, end_time, break_start, break_end,
      late_tolerance_minutes, early_out_tolerance_minutes, status,
      color_bg, color_fg, color_border, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
  `).run(
    def.code, def.name, def.start, def.end, def.breakStart, def.breakEnd,
    def.late, def.early, colors.bg, colors.fg, colors.border, USER, USER,
  );
  return { id: result.lastInsertRowid, created: true };
}

function upsertDepartment(db, def, branchMap) {
  let row = db.prepare('SELECT id FROM departments WHERE code = ? AND deleted_at IS NULL').get(def.code);
  if (!row) {
    const result = db.prepare(`
      INSERT INTO departments (code, name, scope, status, created_by, updated_by)
      VALUES (?, ?, ?, 1, ?, ?)
    `).run(def.code, def.name, def.scope, USER, USER);
    row = { id: result.lastInsertRowid };
  }

  const branchCodes = def.branches?.length ? def.branches : Object.keys(branchMap);
  const ins = db.prepare('INSERT OR IGNORE INTO department_branches (department_id, branch_id) VALUES (?, ?)');
  for (const code of branchCodes) {
    const branchId = branchMap[code];
    if (branchId) ins.run(row.id, branchId);
  }
  return row.id;
}

function upsertPosition(db, departmentId, def) {
  const existing = db.prepare(
    'SELECT id FROM positions WHERE department_id = ? AND code = ? AND deleted_at IS NULL',
  ).get(departmentId, def.code);
  if (existing) {
    db.prepare(`
      UPDATE positions SET name = ?, level = ?, status = 1, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(def.name, def.level, USER, existing.id);
    return { id: existing.id, created: false };
  }

  const result = db.prepare(`
    INSERT INTO positions (department_id, code, name, level, status, created_by, updated_by)
    VALUES (?, ?, ?, ?, 1, ?, ?)
  `).run(departmentId, def.code, def.name, def.level, USER, USER);
  return { id: result.lastInsertRowid, created: true };
}

function getPositionId(db, deptCode, posCode, deptMap) {
  const deptId = deptMap[deptCode];
  if (!deptId) return null;
  const row = db.prepare(
    'SELECT id FROM positions WHERE department_id = ? AND code = ? AND deleted_at IS NULL',
  ).get(deptId, posCode);
  return row?.id;
}

function getShiftId(db, code) {
  const row = db.prepare('SELECT id FROM shifts WHERE code = ? AND deleted_at IS NULL').get(code);
  return row?.id;
}

function upsertEmployee(db, def, ctx) {
  const { branchMap, deptMap, companyId, employmentStatusId } = ctx;
  const branchId = branchMap[def.branch];
  const deptId = deptMap[def.dept];
  const positionId = getPositionId(db, def.dept, def.position, deptMap);
  const shiftId = getShiftId(db, def.shift);
  if (!branchId || !deptId || !positionId || !shiftId) return null;

  const existing = db.prepare('SELECT id FROM karyawan WHERE nik = ? AND deleted_at IS NULL').get(def.nik);
  let employeeId = existing?.id;

  const tanggalMasuk = '2026-09-01';

  if (!employeeId) {
    const employeeNo = generateEmployeeNo(db, branchId, tanggalMasuk);
    const payload = withAuditOnCreate({
      branch_id: branchId,
      employee_no: employeeNo,
      nik: def.nik,
      nama_lengkap: def.name,
      jenis_kelamin: def.gender,
      tanggal_masuk: tanggalMasuk,
      status_karyawan: 'Aktif',
    }, USER);
    const cols = Object.keys(payload);
    const result = db.prepare(
      `INSERT INTO karyawan (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
    ).run(...cols.map((c) => payload[c]));
    employeeId = result.lastInsertRowid;
  } else {
    db.prepare(`
      UPDATE karyawan SET branch_id = ?, nama_lengkap = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(branchId, def.name, USER, employeeId);
  }

  const hasPosition = db.prepare(`
    SELECT id FROM employee_positions
    WHERE employee_id = ? AND position_id = ? AND deleted_at IS NULL
  `).get(employeeId, positionId);

  if (!hasPosition) {
    db.prepare(`
      UPDATE employee_positions SET is_current = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = ? AND is_current = 1 AND deleted_at IS NULL
    `).run(USER, employeeId);

    const posPayload = withAuditOnCreate({
      employee_id: employeeId,
      company_id: companyId,
      branch_id: branchId,
      department_id: deptId,
      position_id: positionId,
      employment_status_id: employmentStatusId,
      start_date: tanggalMasuk,
      is_current: 1,
    }, USER);
    const cols = Object.keys(posPayload);
    db.prepare(
      `INSERT INTO employee_positions (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
    ).run(...cols.map((c) => posPayload[c]));
  }

  const hasShift = db.prepare(`
    SELECT id FROM employee_shifts
    WHERE employee_id = ? AND shift_id = ? AND deleted_at IS NULL
  `).get(employeeId, shiftId);

  if (!hasShift) {
    const shiftPayload = withAuditOnCreate({
      employee_id: employeeId,
      shift_id: shiftId,
      effective_from: tanggalMasuk,
    }, USER);
    const cols = Object.keys(shiftPayload);
    db.prepare(
      `INSERT INTO employee_shifts (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
    ).run(...cols.map((c) => shiftPayload[c]));

    generateMonthlyWorkSchedules(db, {
      employeeId,
      shiftId,
      effectiveFrom: tanggalMasuk,
      userId: USER,
    });
  }

  return employeeId;
}

const LEGACY_POSITION_FIXES = [
  { employeeId: 1, branch: 'BTN', dept: 'KASIR', position: 'KSR-A' },
  { employeeId: 2, branch: 'BTN', dept: 'KASIR', position: 'HEAD-KSR' },
  { employeeId: 3, branch: 'OFFICE', dept: 'IT', position: 'DEV' },
  { employeeId: 4, branch: 'OFFICE', dept: 'HR', position: 'HR-STAFF' },
];

function backfillMissingEmployeePositions(db, ctx) {
  let filled = 0;
  const { branchMap, deptMap, companyId, employmentStatusId } = ctx;
  const tanggalMasuk = '2026-09-01';

  for (const fix of LEGACY_POSITION_FIXES) {
    const exists = db.prepare(`
      SELECT id FROM employee_positions
      WHERE employee_id = ? AND deleted_at IS NULL
    `).get(fix.employeeId);
    if (exists) continue;

    const employee = db.prepare('SELECT id FROM karyawan WHERE id = ? AND deleted_at IS NULL').get(fix.employeeId);
    if (!employee) continue;

    const branchId = branchMap[fix.branch];
    const deptId = deptMap[fix.dept];
    const positionId = getPositionId(db, fix.dept, fix.position, deptMap);
    if (!branchId || !deptId || !positionId) continue;

    const posPayload = withAuditOnCreate({
      employee_id: fix.employeeId,
      company_id: companyId,
      branch_id: branchId,
      department_id: deptId,
      position_id: positionId,
      employment_status_id: employmentStatusId,
      start_date: tanggalMasuk,
      is_current: 1,
    }, USER);
    const cols = Object.keys(posPayload);
    db.prepare(
      `INSERT INTO employee_positions (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
    ).run(...cols.map((c) => posPayload[c]));
    filled += 1;
  }

  return filled;
}

function hashSeed(employeeId, workDate) {
  const s = `${employeeId}:${workDate}`;
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function addMinutesToTime(timeStr, minutes) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor((total % (24 * 60) + 24 * 60) % (24 * 60) / 60);
  const nm = ((total % 60) + 60) % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function toDateTime(workDate, timeStr) {
  if (!workDate || !timeStr) return null;
  return `${workDate} ${timeStr}:00`;
}

function deriveAttendanceFromSchedule(schedule) {
  const seed = hashSeed(schedule.employee_id, schedule.work_date);

  if (schedule.status === 'OFF' || schedule.status === 'HOLIDAY') {
    return { status: 'OFF', clock_in: null, clock_out: null, late_minutes: 0, early_out_minutes: 0, overtime_minutes: 0 };
  }
  if (schedule.status === 'LEAVE') {
    return { status: 'LEAVE', clock_in: null, clock_out: null, late_minutes: 0, early_out_minutes: 0, overtime_minutes: 0 };
  }

  const bucket = seed % 100;
  const start = schedule.start_time || schedule.shift_start || '08:00';
  const end = schedule.end_time || schedule.shift_end || '17:00';

  if (bucket < 78) {
    return {
      status: 'PRESENT',
      clock_in: toDateTime(schedule.work_date, start),
      clock_out: toDateTime(schedule.work_date, end),
      late_minutes: 0,
      early_out_minutes: 0,
      overtime_minutes: seed % 3 === 0 ? 30 : 0,
    };
  }
  if (bucket < 90) {
    const late = 10 + (seed % 35);
    const clockIn = addMinutesToTime(start, late);
    return {
      status: 'LATE',
      clock_in: toDateTime(schedule.work_date, clockIn),
      clock_out: toDateTime(schedule.work_date, end),
      late_minutes: late,
      early_out_minutes: 0,
      overtime_minutes: 0,
    };
  }
  return {
    status: 'ABSENT',
    clock_in: null,
    clock_out: null,
    late_minutes: 0,
    early_out_minutes: 0,
    overtime_minutes: 0,
  };
}

/** Generate kehadiran dummy dari jadwal kerja September 2026 (idempotent). */
export function seedDummyAttendances(db, { month = '2026-09' } = {}) {
  const [year, mon] = month.split('-').map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  const from = `${month}-01`;
  const to = `${month}-${String(lastDay).padStart(2, '0')}`;

  const schedules = db.prepare(`
    SELECT ws.*, s.start_time AS shift_start, s.end_time AS shift_end
    FROM work_schedules ws
    LEFT JOIN shifts s ON s.id = ws.shift_id AND s.deleted_at IS NULL
    WHERE ws.deleted_at IS NULL AND ws.work_date >= ? AND ws.work_date <= ?
  `).all(from, to);

  const existsStmt = db.prepare(`
    SELECT id FROM attendances
    WHERE employee_id = ? AND work_date = ? AND deleted_at IS NULL
  `);

  let created = 0;
  let skipped = 0;

  const run = db.transaction(() => {
    for (const schedule of schedules) {
      if (existsStmt.get(schedule.employee_id, schedule.work_date)) {
        skipped += 1;
        continue;
      }

      const att = deriveAttendanceFromSchedule(schedule);
      const payload = withAuditOnCreate({
        employee_id: schedule.employee_id,
        work_date: schedule.work_date,
        schedule_id: schedule.id,
        clock_in: att.clock_in,
        clock_out: att.clock_out,
        late_minutes: att.late_minutes,
        early_out_minutes: att.early_out_minutes,
        overtime_minutes: att.overtime_minutes,
        status: att.status,
        anomaly_flag: att.status === 'LATE' && att.late_minutes > 30 ? 1 : 0,
        anomaly_reason: att.status === 'LATE' && att.late_minutes > 30 ? 'Keterlambatan > 30 menit' : null,
      }, USER);

      const cols = Object.keys(payload);
      db.prepare(
        `INSERT INTO attendances (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      ).run(...cols.map((c) => payload[c]));
      created += 1;
    }
  });

  run();

  const total = db.prepare(`
    SELECT COUNT(*) AS c FROM attendances
    WHERE deleted_at IS NULL AND work_date >= ? AND work_date <= ?
  `).get(from, to).c;

  return { created, skipped, total, from, to };
}

/**
 * Isi data dummy: shift lengkap, jabatan per departemen, dan karyawan contoh.
 * Aman dijalankan berulang (upsert / skip duplikat).
 */
export function seedDummyData(db) {
  const summary = {
    shiftsCreated: 0,
    shiftsUpdated: 0,
    departmentsCreated: 0,
    positionsCreated: 0,
    positionsUpdated: 0,
    employeesProcessed: 0,
    positionsBackfilled: 0,
    attendancesCreated: 0,
    attendancesSkipped: 0,
    attendanceCount: 0,
    shiftCount: 0,
    positionCount: 0,
    employeeCount: 0,
  };

  const branchMap = getBranchMap(db);
  const deptMap = getDeptMap(db);
  const companyId = getCompanyId(db);
  const employmentStatusId = getEmploymentStatusId(db);

  if (!companyId || !employmentStatusId) {
    throw new Error('Perusahaan atau status karyawan belum ada — jalankan seed dasar terlebih dahulu');
  }

  db.transaction(() => {
    for (const def of SHIFT_DEFS) {
      const { created } = upsertShift(db, def);
      if (created) summary.shiftsCreated += 1;
      else summary.shiftsUpdated += 1;
    }

    for (const def of EXTRA_DEPARTMENTS) {
      const before = deptMap[def.code];
      const deptId = upsertDepartment(db, def, branchMap);
      if (!before) {
        summary.departmentsCreated += 1;
        deptMap[def.code] = deptId;
      }
    }

    const allDepts = db.prepare('SELECT id, code FROM departments WHERE deleted_at IS NULL').all();
    for (const dept of allDepts) {
      const defs = POSITIONS_BY_DEPT[dept.code] || DEFAULT_POSITIONS;
      for (const pos of defs) {
        const { created } = upsertPosition(db, dept.id, pos);
        if (created) summary.positionsCreated += 1;
        else summary.positionsUpdated += 1;
      }
    }

    const ctx = { branchMap, deptMap, companyId, employmentStatusId };
    for (const emp of EMPLOYEE_DEFS) {
      const id = upsertEmployee(db, emp, ctx);
      if (id) summary.employeesProcessed += 1;
    }

    summary.positionsBackfilled = backfillMissingEmployeePositions(db, ctx);
  })();

  const att = seedDummyAttendances(db, { month: '2026-09' });
  summary.attendancesCreated = att.created;
  summary.attendancesSkipped = att.skipped;
  summary.attendanceCount = att.total;

  summary.shiftCount = db.prepare('SELECT COUNT(*) as c FROM shifts WHERE deleted_at IS NULL').get().c;
  summary.positionCount = db.prepare('SELECT COUNT(*) as c FROM positions WHERE deleted_at IS NULL').get().c;
  summary.employeeCount = db.prepare('SELECT COUNT(*) as c FROM karyawan WHERE deleted_at IS NULL').get().c;

  return summary;
}
