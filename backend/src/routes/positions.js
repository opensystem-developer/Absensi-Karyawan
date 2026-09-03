import { createMasterRouter } from '../utils/masterRouter.js';

const toRes = (r) => r ? { ...r, status: !!r.status } : r;

export default createMasterRouter({
  tableName: 'positions',
  entityName: 'Jabatan',
  fields: ['department_id', 'code', 'name', 'level', 'status'],
  required: ['department_id', 'code', 'name'],
  boolFields: ['status'],
  orderBy: 'name ASC',
  transformResponse: toRes,
  transformInput: (d) => { if (d.status === undefined) d.status = 1; if (d.department_id) d.department_id = parseInt(d.department_id, 10); return d; },
  listQuery: (req, params) => {
    if (req.query.department_id) { params.push(req.query.department_id); return ' AND department_id = ?'; }
    return '';
  },
});
