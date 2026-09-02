import { createEmployeeResourceRouter } from '../utils/resourceRouter.js';

const toResponse = (row) => row ? { ...row, is_primary: !!row.is_primary } : row;

export default createEmployeeResourceRouter({
  tableName: 'kontak_karyawan',
  entityName: 'Kontak',
  fields: ['type', 'nama', 'hubungan', 'nomor_telepon', 'is_primary', 'keterangan'],
  required: ['type', 'nama'],
  hasPrimary: true,
  orderBy: 'is_primary DESC, type ASC',
  transformResponse: toResponse,
  validate: (data) => {
    if (data.type && !['PERSONAL', 'EMERGENCY'].includes(data.type)) {
      return 'Tipe kontak harus PERSONAL atau EMERGENCY';
    }
    return null;
  },
});
