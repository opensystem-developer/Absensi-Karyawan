import { createEmployeeResourceRouter } from '../utils/resourceRouter.js';
import { enrichEmployeeShiftRow } from '../utils/shiftHelpers.js';

export default createEmployeeResourceRouter({
  tableName: 'employee_shifts',
  entityName: 'Shift karyawan',
  fields: ['shift_id', 'effective_from', 'effective_to'],
  required: ['shift_id', 'effective_from'],
  orderBy: 'effective_from DESC',
  transformResponse: enrichEmployeeShiftRow,
  transformInput: (d) => {
    if (d.shift_id) d.shift_id = parseInt(d.shift_id, 10);
    return d;
  },
});
