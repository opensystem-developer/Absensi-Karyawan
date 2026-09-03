import { createMasterRouter } from '../utils/masterRouter.js';

const toRes = (r) => r ? { ...r, status: !!r.status } : r;

export default createMasterRouter({
  tableName: 'companies',
  entityName: 'Perusahaan',
  fields: ['code', 'name', 'status'],
  required: ['code', 'name'],
  boolFields: ['status'],
  orderBy: 'name ASC',
  transformResponse: toRes,
  transformInput: (d) => { if (d.status === undefined) d.status = 1; return d; },
});
