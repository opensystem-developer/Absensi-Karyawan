/**
 * Baris karyawan untuk grid jadwal/kehadiran — nama + jabatan singkat + no karyawan.
 */
export function toScheduleGridRow(employee) {
  if (!employee) return null;
  const positionShort = employee.position_code || '';
  const employeeNo = employee.employee_no || '';
  const metaParts = [positionShort, employeeNo].filter(Boolean);

  return {
    id: employee.id,
    name: employee.nama_lengkap,
    positionShort,
    positionName: employee.position_name || '',
    employeeNo,
    subtitle: metaParts.join(' · '),
  };
}

export function toScheduleGridRows(employees, employeeIds = null) {
  const idSet = employeeIds ? new Set(employeeIds) : null;
  return employees
    .filter((e) => !idSet || idSet.has(e.id))
    .map(toScheduleGridRow)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));
}
