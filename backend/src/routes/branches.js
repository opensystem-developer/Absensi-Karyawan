import { createMasterRouter } from '../utils/masterRouter.js';

const toRes = (r) => r ? { ...r, status: !!r.status } : r;

export default createMasterRouter({
  tableName: 'branches',
  entityName: 'Cabang',
  fields: ['company_id', 'code', 'name', 'address', 'phone', 'status'],
  required: ['company_id', 'code', 'name'],
  boolFields: ['status'],
  orderBy: 'name ASC',
  transformResponse: toRes,
  transformInput: (d) => { if (d.status === undefined) d.status = 1; if (d.company_id) d.company_id = parseInt(d.company_id, 10); return d; },
  listQuery: (req, params) => {
    if (req.query.company_id) { params.push(req.query.company_id); return ' AND company_id = ?'; }
    return '';
  },
});
