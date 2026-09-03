import { createEmployeeResourceRouter } from '../utils/resourceRouter.js';

export default createEmployeeResourceRouter({
  tableName: 'employee_contracts',
  entityName: 'Kontrak karyawan',
  fields: ['contract_no', 'type', 'start_date', 'end_date', 'status', 'document_path'],
  required: ['contract_no', 'type'],
  orderBy: 'start_date DESC',
  transformInput: (d) => { if (!d.status) d.status = 'ACTIVE'; return d; },
  validate: (data) => {
    if (data.status && !['ACTIVE', 'EXPIRED', 'TERMINATED'].includes(data.status)) {
      return 'Status kontrak harus ACTIVE, EXPIRED, atau TERMINATED';
    }
    return null;
  },
});
