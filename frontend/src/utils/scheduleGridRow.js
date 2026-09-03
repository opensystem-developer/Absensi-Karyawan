/**
 * Baris karyawan untuk grid jadwal/kehadiran — nama + jabatan singkat + no karyawan.
 */
export function toScheduleGridRow(employee, positionOverride = null) {
  if (!employee) return null;
  const positionShort = positionOverride?.position_code || employee.position_code || '';
  const positionName = positionOverride?.position_name || employee.position_name || '';
  const employeeNo = employee.employee_no || '';

  return {
    id: employee.id,
    name: employee.nama_lengkap,
    positionShort,
    positionName,
    employeeNo,
    subtitle: [positionShort, employeeNo].filter(Boolean).join(' · '),
  };
}

function positionMapFromItems(items = []) {
  const map = new Map();
  for (const item of items) {
    const employeeId = item.employee_id;
    if (!employeeId || map.has(employeeId)) continue;
    if (item.position_code || item.position_name) {
      map.set(employeeId, {
        position_code: item.position_code || '',
        position_name: item.position_name || '',
      });
    }
  }
  return map;
}

export function toScheduleGridRows(employees, employeeIds = null, items = []) {
  const idSet = employeeIds ? new Set(employeeIds) : null;
  const positionsByEmployee = positionMapFromItems(items);
  const offCounts = countOffDaysByEmployee(items);

  return employees
    .filter((e) => !idSet || idSet.has(e.id))
    .map((e) => {
      const row = toScheduleGridRow(e, positionsByEmployee.get(e.id));
      if (!row) return null;
      return {
        ...row,
        offDaysCount: offCounts.get(e.id) || 0,
        branchId: e.branch_id || null,
        branchCode: e.branch_code || '',
        branchName: e.branch_name || '',
      };
    })
    .filter(Boolean);
}

function countOffDaysByEmployee(items = []) {
  const map = new Map();
  for (const item of items) {
    if (item.status !== 'OFF') continue;
    map.set(item.employee_id, (map.get(item.employee_id) || 0) + 1);
  }
  return map;
}

/** Urutkan baris grid jadwal: nama atau jabatan (kode singkat). */
export function sortScheduleGridRows(rows, sortBy = 'name') {
  const sorted = [...rows];
  if (sortBy === 'position') {
    sorted.sort((a, b) => {
      const pa = a.positionShort || '';
      const pb = b.positionShort || '';
      if (!pa && pb) return 1;
      if (pa && !pb) return -1;
      const byPosition = pa.localeCompare(pb, 'id', { sensitivity: 'base' });
      if (byPosition !== 0) return byPosition;
      return a.name.localeCompare(b.name, 'id');
    });
    return sorted;
  }

  sorted.sort((a, b) => a.name.localeCompare(b.name, 'id'));
  return sorted;
}

/** Filter baris grid berdasarkan nama / no karyawan / kode jabatan (multi). */
export function filterScheduleGridRows(rows, { nameQuery = '', positionCodes = [] } = {}) {
  const q = nameQuery.trim().toLowerCase();
  const codes = new Set((positionCodes || []).filter(Boolean));

  return rows.filter((row) => {
    if (codes.size > 0 && !codes.has(row.positionShort)) return false;
    if (!q) return true;
    const haystack = [
      row.name,
      row.employeeNo,
      row.positionShort,
      row.positionName,
      row.branchCode,
      row.branchName,
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

/** Opsi jabatan unik dari baris grid (untuk dropdown filter). */
export function collectPositionFilterOptions(rows) {
  const codes = new Map();
  for (const row of rows) {
    if (!row.positionShort) continue;
    if (!codes.has(row.positionShort)) {
      codes.set(row.positionShort, row.positionName || row.positionShort);
    }
  }
  return [...codes.entries()]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.code.localeCompare(b.code, 'id'));
}
