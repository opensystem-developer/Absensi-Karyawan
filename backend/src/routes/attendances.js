import { createEmployeeResourceRouter } from '../utils/resourceRouter.js';
import { enrichAttendanceRow, ATTENDANCE_STATUSES, parseIntFields } from '../utils/shiftHelpers.js';

export default createEmployeeResourceRouter({
  tableName: 'attendances',
  entityName: 'Kehadiran',
  fields: [
    'work_date', 'schedule_id', 'clock_in', 'clock_out',
    'late_minutes', 'early_out_minutes', 'overtime_minutes',
    'status', 'anomaly_flag', 'anomaly_reason',
  ],
  required: ['work_date'],
  orderBy: 'work_date DESC',
  transformResponse: enrichAttendanceRow,
  transformInput: (d) => {
    parseIntFields(d, ['schedule_id', 'late_minutes', 'early_out_minutes', 'overtime_minutes']);
    if (!d.status) d.status = 'PRESENT';
    if (d.anomaly_flag !== undefined) d.anomaly_flag = d.anomaly_flag ? 1 : 0;
    return d;
  },
  validate: (data) => {
    if (data.status && !ATTENDANCE_STATUSES.includes(data.status)) {
      return `Status kehadiran harus: ${ATTENDANCE_STATUSES.join(', ')}`;
    }
    return null;
  },
});
