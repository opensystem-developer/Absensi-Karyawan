/**
 * Ambil jabatan per karyawan — prioritas is_current, fallback posisi terbaru.
 */
export function getCurrentPositionMap(db, employeeIds = []) {
  let sql = `
    SELECT ep.employee_id, p.code AS position_code, p.name AS position_name, ep.is_current, ep.start_date
    FROM employee_positions ep
    JOIN positions p ON p.id = ep.position_id AND p.deleted_at IS NULL
    WHERE ep.deleted_at IS NULL
  `;
  const params = [];
  if (employeeIds.length > 0) {
    sql += ` AND ep.employee_id IN (${employeeIds.map(() => '?').join(',')})`;
    params.push(...employeeIds);
  }
  sql += ' ORDER BY ep.employee_id, ep.is_current DESC, ep.start_date DESC';

  const map = {};
  for (const row of db.prepare(sql).all(...params)) {
    if (!map[row.employee_id]) {
      map[row.employee_id] = {
        position_code: row.position_code,
        position_name: row.position_name,
      };
    }
  }
  return map;
}

export function enrichKaryawanWithPosition(db, row) {
  if (!row) return row;
  const pos = db.prepare(`
    SELECT p.code AS position_code, p.name AS position_name
    FROM employee_positions ep
    JOIN positions p ON p.id = ep.position_id AND p.deleted_at IS NULL
    WHERE ep.employee_id = ? AND ep.deleted_at IS NULL
    ORDER BY ep.is_current DESC, ep.start_date DESC
    LIMIT 1
  `).get(row.id);
  return {
    ...row,
    position_code: pos?.position_code || null,
    position_name: pos?.position_name || null,
  };
}

export function enrichKaryawanListWithPositions(db, rows) {
  const positionMap = getCurrentPositionMap(db, rows.map((r) => r.id));
  return rows.map((row) => ({
    ...row,
    position_code: positionMap[row.id]?.position_code || null,
    position_name: positionMap[row.id]?.position_name || null,
  }));
}
