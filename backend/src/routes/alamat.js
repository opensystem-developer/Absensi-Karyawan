import { createEmployeeResourceRouter } from '../utils/resourceRouter.js';

const toResponse = (row) => row ? { ...row, is_primary: !!row.is_primary } : row;

export default createEmployeeResourceRouter({
  tableName: 'alamat_karyawan',
  entityName: 'Alamat',
  fields: ['type', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kota', 'provinsi', 'kode_pos', 'is_primary'],
  required: ['type', 'alamat'],
  hasPrimary: true,
  orderBy: 'is_primary DESC, type ASC',
  transformResponse: toResponse,
  validate: (data) => {
    if (data.type && !['KTP', 'DOMISILI'].includes(data.type)) {
      return 'Tipe alamat harus KTP atau DOMISILI';
    }
    return null;
  },
});
