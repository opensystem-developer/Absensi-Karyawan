import { withAuditOnCreate } from './audit.js';
import { getEmployeeScheduleContext, planOffDates } from './scheduleOffPlanner.js';

function endOfMonth(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

function addDays(dateStr, days) {
  const dt = new Date(`${dateStr}T12:00:00`);
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
}

function eachDate(from, to) {
  const dates = [];
  let current = from;
  while (current <= to) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Generate work schedules for one calendar month (from effective_from through month end),
 * with smart OFF days so peers in the same jabatan+cabang rarely libur bersamaan.
 */
export function generateMonthlyWorkSchedules(db, {
  employeeId,
  shiftId,
  effectiveFrom,
  effectiveTo = null,
  monthlyOffDays = 4,
  userId = 'system',
}) {
  if (!employeeId || !shiftId || !effectiveFrom) {
    return { created: 0, skipped: 0, offDays: 0, from: null, to: null };
  }

  const periodEnd = endOfMonth(effectiveFrom);
  const rangeEnd = effectiveTo && effectiveTo < periodEnd ? effectiveTo : periodEnd;
  if (effectiveFrom > rangeEnd) {
    return { created: 0, skipped: 0, offDays: 0, from: effectiveFrom, to: rangeEnd };
  }

  const dates = eachDate(effectiveFrom, rangeEnd);
  const offCount = Math.max(0, Math.min(monthlyOffDays, dates.length - 1));
  const { branchId, positionId } = getEmployeeScheduleContext(db, employeeId);
  const offDates = planOffDates(db, {
    employeeId,
    branchId,
    positionId,
    dates,
    monthlyOffDays: offCount,
  });

  const existsStmt = db.prepare(`
    SELECT id FROM work_schedules
    WHERE employee_id = ? AND work_date = ? AND deleted_at IS NULL
  `);

  const insertStmt = db.prepare(`
    INSERT INTO work_schedules (employee_id, work_date, shift_id, status, created_by, created_at, updated_by, updated_at, deleted_by, deleted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
  `);

  let created = 0;
  let skipped = 0;
  let offDays = 0;
  const audit = withAuditOnCreate({}, userId);

  const run = db.transaction(() => {
    for (const workDate of dates) {
      if (existsStmt.get(employeeId, workDate)) {
        skipped += 1;
        continue;
      }
      const status = offDates.has(workDate) ? 'OFF' : 'WORK';
      if (status === 'OFF') offDays += 1;
      insertStmt.run(
        employeeId,
        workDate,
        shiftId,
        status,
        audit.created_by,
        audit.created_at,
        audit.updated_by,
        audit.updated_at,
      );
      created += 1;
    }
  });

  run();

  return {
    created,
    skipped,
    offDays,
    from: effectiveFrom,
    to: rangeEnd,
  };
}
