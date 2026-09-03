export const WORK_SCHEDULE_STATUS_OPTIONS = [
  { value: 'WORK', label: 'Kerja' },
  { value: 'OFF', label: 'Libur' },
  { value: 'LEAVE', label: 'Cuti' },
  { value: 'HOLIDAY', label: 'Libur Nasional' },
];

export const ATTENDANCE_STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Hadir' },
  { value: 'LATE', label: 'Terlambat' },
  { value: 'ABSENT', label: 'Tidak Hadir' },
  { value: 'LEAVE', label: 'Cuti' },
  { value: 'OFF', label: 'Libur' },
];

export const EMPTY_EMPLOYEE_SHIFT_FORM = {
  shift_id: '',
  effective_from: '',
  effective_to: '',
};

export function toEmployeeShiftFormData(item) {
  if (!item) return { ...EMPTY_EMPLOYEE_SHIFT_FORM };
  return {
    shift_id: item.shift_id ?? '',
    effective_from: item.effective_from?.slice?.(0, 10) || item.effective_from || '',
    effective_to: item.effective_to?.slice?.(0, 10) || item.effective_to || '',
  };
}

export const EMPTY_WORK_SCHEDULE_FORM = {
  work_date: '',
  shift_id: '',
  start_time: '',
  end_time: '',
  status: 'WORK',
};

export function toWorkScheduleFormData(item) {
  if (!item) return { ...EMPTY_WORK_SCHEDULE_FORM };
  return {
    work_date: item.work_date?.slice?.(0, 10) || item.work_date || '',
    shift_id: item.shift_id ?? '',
    start_time: item.start_time || '',
    end_time: item.end_time || '',
    status: item.status || 'WORK',
  };
}

export const EMPTY_ATTENDANCE_FORM = {
  work_date: '',
  schedule_id: '',
  clock_in: '',
  clock_out: '',
  late_minutes: 0,
  early_out_minutes: 0,
  overtime_minutes: 0,
  status: 'PRESENT',
  anomaly_flag: false,
  anomaly_reason: '',
};

export function toAttendanceFormData(item) {
  if (!item) return { ...EMPTY_ATTENDANCE_FORM };
  return {
    work_date: item.work_date?.slice?.(0, 10) || item.work_date || '',
    schedule_id: item.schedule_id ?? '',
    clock_in: item.clock_in ? item.clock_in.replace(' ', 'T').slice(0, 16) : '',
    clock_out: item.clock_out ? item.clock_out.replace(' ', 'T').slice(0, 16) : '',
    late_minutes: item.late_minutes ?? 0,
    early_out_minutes: item.early_out_minutes ?? 0,
    overtime_minutes: item.overtime_minutes ?? 0,
    status: item.status || 'PRESENT',
    anomaly_flag: !!item.anomaly_flag,
    anomaly_reason: item.anomaly_reason || '',
  };
}

export function formatTimeRange(start, end) {
  if (!start && !end) return '-';
  return `${start || '?'} - ${end || '?'}`;
}

export function workScheduleStatusLabel(status) {
  return WORK_SCHEDULE_STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
}

export function attendanceStatusLabel(status) {
  return ATTENDANCE_STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
}
