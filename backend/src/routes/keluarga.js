import { createEmployeeResourceRouter } from '../utils/resourceRouter.js';

export default createEmployeeResourceRouter({
  tableName: 'keluarga_karyawan',
  entityName: 'Data keluarga',
  fields: ['nama', 'hubungan', 'jenis_kelamin', 'tanggal_lahir', 'pekerjaan', 'keterangan'],
  required: ['nama'],
  orderBy: 'hubungan ASC, nama ASC',
  validate: (data) => {
    if (data.jenis_kelamin && !['L', 'P'].includes(data.jenis_kelamin)) {
      return 'Jenis kelamin harus L atau P';
    }
    return null;
  },
});
