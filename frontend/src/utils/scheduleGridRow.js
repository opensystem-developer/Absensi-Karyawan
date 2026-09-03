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

  return employees
    .filter((e) => !idSet || idSet.has(e.id))
    .map((e) => toScheduleGridRow(e, positionsByEmployee.get(e.id)))
    .filter(Boolean);
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
