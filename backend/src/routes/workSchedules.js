import { createEmployeeResourceRouter } from '../utils/resourceRouter.js';
import { enrichWorkScheduleRow, WORK_SCHEDULE_STATUSES } from '../utils/shiftHelpers.js';

export default createEmployeeResourceRouter({
  tableName: 'work_schedules',
  entityName: 'Jadwal kerja',
  fields: ['work_date', 'shift_id', 'start_time', 'end_time', 'status'],
  required: ['work_date', 'shift_id'],
  orderBy: 'work_date DESC',
  transformResponse: enrichWorkScheduleRow,
  transformInput: (d) => {
    if (d.shift_id) d.shift_id = parseInt(d.shift_id, 10);
    if (!d.status) d.status = 'WORK';
    return d;
  },
  validate: (data) => {
    if (data.status && !WORK_SCHEDULE_STATUSES.includes(data.status)) {
      return `Status jadwal harus: ${WORK_SCHEDULE_STATUSES.join(', ')}`;
    }
    return null;
  },
});
