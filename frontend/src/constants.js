export const EMPTY_FORM = {
  employee_no: '',
  nik: '',
  nama_lengkap: '',
  nama_panggilan: '',
  jenis_kelamin: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  agama: '',
  status_pernikahan: '',
  jumlah_anak: 0,
  no_kk: '',
  npwp: '',
  no_bpjs_kesehatan: '',
  no_bpjs_tk: '',
  tanggal_masuk: '',
  tanggal_keluar: '',
  status_karyawan: 'Aktif',
  alasan_keluar: '',
  keterangan: '',
};

export const STATUS_OPTIONS = ['Aktif', 'Nonaktif', 'Resign', 'PHK'];
export const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];
export const STATUS_NIKAH_OPTIONS = ['Belum Menikah', 'Menikah', 'Cerai', 'Janda', 'Duda'];

export function toFormData(karyawan) {
  if (!karyawan) return { ...EMPTY_FORM };
  const data = { ...EMPTY_FORM };
  for (const key of Object.keys(EMPTY_FORM)) {
    data[key] = karyawan[key] ?? EMPTY_FORM[key];
  }
  return data;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function badgeClass(status) {
  const map = { Aktif: 'badge-aktif', Nonaktif: 'badge-nonaktif', Resign: 'badge-resign', PHK: 'badge-phk' };
  return map[status] || 'badge-nonaktif';
}
