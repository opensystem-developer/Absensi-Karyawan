import { createEmployeeResourceRouter } from '../utils/resourceRouter.js';

export default createEmployeeResourceRouter({
  tableName: 'pendidikan_karyawan',
  entityName: 'Data pendidikan',
  fields: ['tingkat', 'nama_sekolah', 'jurusan', 'tahun_lulus', 'keterangan'],
  required: ['tingkat', 'nama_sekolah'],
  orderBy: 'tahun_lulus DESC, tingkat ASC',
});
