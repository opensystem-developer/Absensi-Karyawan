import { createMasterRouter } from '../utils/masterRouter.js';

export default createMasterRouter({
  tableName: 'employment_statuses',
  entityName: 'Status Karyawan',
  fields: ['code', 'name'],
  required: ['code', 'name'],
  orderBy: 'code ASC',
});
