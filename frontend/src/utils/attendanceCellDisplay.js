const ATTENDANCE_CELL = {
  PRESENT: 'H',
  LATE: 'T',
  ABSENT: 'A',
  LEAVE: 'CT',
  OFF: 'OFF',
};

const DEFAULT_ATTENDANCE_COLORS = {
  PRESENT: { bg: '#dcfce7', fg: '#166534', border: '#86efac' },
  LATE: { bg: '#ffedd5', fg: '#c2410c', border: '#fdba74' },
  ABSENT: { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  LEAVE: { bg: '#fef3c7', fg: '#b45309', border: '#fcd34d' },
  OFF: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
};

export const ATTENDANCE_LEGEND = [
  { status: 'PRESENT', label: 'Hadir', cellCode: 'H' },
  { status: 'LATE', label: 'Terlambat', cellCode: 'T' },
  { status: 'ABSENT', label: 'Tidak Hadir', cellCode: 'A' },
  { status: 'LEAVE', label: 'Cuti', cellCode: 'CT' },
  { status: 'OFF', label: 'Libur', cellCode: 'OFF' },
];

function colorStyle(colors) {
  if (!colors) return {};
  return {
    backgroundColor: colors.bg,
    color: colors.fg,
    borderColor: colors.border || colors.bg,
  };
}

export function buildAttendanceCellMap(attendances) {
  const map = new Map();
  for (const item of attendances) {
    map.set(`${item.employee_id}::${item.work_date}`, item);
  }
  return map;
}

export function attendanceCellLabel(item) {
  if (!item) return '';
  return ATTENDANCE_CELL[item.status] || item.status || '';
}

export function colorForAttendanceStatusFromConfig(config, status) {
  const entry = config?.attendanceStatus?.[status];
  if (entry?.bg && entry?.fg) {
    return { bg: entry.bg, fg: entry.fg, border: entry.border || entry.bg };
  }
  return DEFAULT_ATTENDANCE_COLORS[status] || null;
}

export function getAttendanceCellDisplay(item, colorConfig = null) {
  if (!item) {
    return { label: '', style: {}, className: 'schedule-grid-cell' };
  }

  const colors = colorForAttendanceStatusFromConfig(colorConfig, item.status);
  const statusKey = (item.status || 'present').toLowerCase();

  return {
    label: attendanceCellLabel(item),
    className: `schedule-grid-cell schedule-grid-filled schedule-cell-attendance schedule-cell-attendance-${statusKey}`,
    style: colorStyle(colors),
  };
}

export function attendanceCellTitle(item, formatDateTime) {
  if (!item) return '';
  const parts = [];
  if (item.status) parts.push(item.status);
  if (item.clock_in) parts.push(`In: ${formatDateTime(item.clock_in)}`);
  if (item.clock_out) parts.push(`Out: ${formatDateTime(item.clock_out)}`);
  if (item.late_minutes > 0) parts.push(`Telat ${item.late_minutes} mnt`);
  if (item.overtime_minutes > 0) parts.push(`Lembur ${item.overtime_minutes} mnt`);
  if (item.anomaly_flag) parts.push('Anomali');
  return parts.join(' · ');
}

export function legendColorForAttendance(config, status) {
  return colorForAttendanceStatusFromConfig(config, status);
}
