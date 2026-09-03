/**
 * Rencanakan tanggal libur agar karyawan dengan jabatan & cabang sama
 * tidak libur bersamaan (minimalkan bentrok).
 */
export function planOffDates(db, {
  employeeId,
  branchId,
  positionId,
  dates,
  monthlyOffDays,
}) {
  if (!dates?.length || monthlyOffDays <= 0) return new Set();

  const from = dates[0];
  const to = dates[dates.length - 1];
  const peerCounts = {};

  if (branchId && positionId) {
    const rows = db.prepare(`
      SELECT ws.work_date AS d, COUNT(*) AS cnt
      FROM work_schedules ws
      JOIN employee_positions ep ON ep.employee_id = ws.employee_id
        AND ep.is_current = 1 AND ep.deleted_at IS NULL
      WHERE ws.deleted_at IS NULL
        AND ws.status = 'OFF'
        AND ws.work_date >= ? AND ws.work_date <= ?
        AND ep.branch_id = ?
        AND ep.position_id = ?
        AND ws.employee_id != ?
      GROUP BY ws.work_date
    `).all(from, to, branchId, positionId, employeeId);

    for (const row of rows) peerCounts[row.d] = row.cnt;
  }

  const ranked = [...dates].map((date, idx) => ({
    date,
    idx,
    peer: peerCounts[date] || 0,
    dow: new Date(`${date}T12:00:00`).getDay(),
  })).sort((a, b) => {
    if (a.peer !== b.peer) return a.peer - b.peer;
  // Prefer Sunday as off day when peer count ties
    const aSun = a.dow === 0 ? -1 : 0;
    const bSun = b.dow === 0 ? -1 : 0;
    if (aSun !== bSun) return aSun - bSun;
    return a.idx - b.idx;
  });

  const selected = [];
  const minGap = Math.max(2, Math.floor(dates.length / (monthlyOffDays + 1)));

  for (const candidate of ranked) {
    if (selected.length >= monthlyOffDays) break;
    const tooClose = selected.some((s) => Math.abs(s.idx - candidate.idx) < minGap);
    if (tooClose) continue;
    selected.push(candidate);
  }

  for (const candidate of ranked) {
    if (selected.length >= monthlyOffDays) break;
    if (selected.some((s) => s.date === candidate.date)) continue;
    selected.push(candidate);
  }

  return new Set(selected.map((s) => s.date));
}

export function getEmployeeScheduleContext(db, employeeId) {
  const karyawan = db.prepare(`
    SELECT branch_id FROM karyawan WHERE id = ? AND deleted_at IS NULL
  `).get(employeeId);

  const position = db.prepare(`
    SELECT ep.branch_id, ep.position_id
    FROM employee_positions ep
    WHERE ep.employee_id = ? AND ep.deleted_at IS NULL
    ORDER BY ep.is_current DESC, ep.start_date DESC
    LIMIT 1
  `).get(employeeId);

  return {
    branchId: position?.branch_id || karyawan?.branch_id || null,
    positionId: position?.position_id || null,
  };
}
