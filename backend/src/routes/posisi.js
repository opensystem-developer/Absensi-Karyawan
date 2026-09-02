import { createEmployeeResourceRouter } from '../utils/resourceRouter.js';

const toRes = (r) => r ? { ...r, is_current: !!r.is_current } : r;

export default createEmployeeResourceRouter({
  tableName: 'employee_positions',
  entityName: 'Posisi karyawan',
  fields: ['company_id', 'branch_id', 'department_id', 'position_id', 'employment_status_id', 'start_date', 'end_date', 'is_current', 'reason'],
  required: ['company_id', 'branch_id', 'department_id', 'position_id', 'employment_status_id'],
  hasPrimary: true,
  primaryField: 'is_current',
  orderBy: 'is_current DESC, start_date DESC',
  transformResponse: toRes,
  transformInput: (d) => {
    ['company_id', 'branch_id', 'department_id', 'position_id', 'employment_status_id'].forEach((f) => {
      if (d[f]) d[f] = parseInt(d[f], 10);
    });
    return d;
  },
});
