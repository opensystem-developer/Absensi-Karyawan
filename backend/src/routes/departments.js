import { createMasterRouter } from '../utils/masterRouter.js';

const toRes = (r) => r ? { ...r, status: !!r.status } : r;

export default createMasterRouter({
  tableName: 'departments',
  entityName: 'Departemen',
  fields: ['branch_id', 'code', 'name', 'status'],
  required: ['branch_id', 'code', 'name'],
  boolFields: ['status'],
  orderBy: 'name ASC',
  transformResponse: toRes,
  transformInput: (d) => { if (d.status === undefined) d.status = 1; if (d.branch_id) d.branch_id = parseInt(d.branch_id, 10); return d; },
  listQuery: (req, params) => {
    if (req.query.branch_id) { params.push(req.query.branch_id); return ' AND branch_id = ?'; }
    return '';
  },
});
