export const EMPTY_KARYAWAN_FORM = {
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
};

export const EMPTY_PEKERJAAN_FORM = {
  branch_id: '',
  employee_no: '',
  tanggal_masuk: '',
  tanggal_keluar: '',
  status_karyawan: 'Aktif',
  alasan_keluar: '',
  keterangan: '',
};

export const EMPTY_FORM = { ...EMPTY_KARYAWAN_FORM, ...EMPTY_PEKERJAAN_FORM };

export const STATUS_OPTIONS = ['Aktif', 'Nonaktif', 'Resign', 'PHK'];
export const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];
export const STATUS_NIKAH_OPTIONS = ['Belum Menikah', 'Menikah', 'Cerai', 'Janda', 'Duda'];

import { formatDate, formatDateTime, toInputDate, formatMaybeDate } from './utils/date';

export { formatDate, formatDateTime, toInputDate, formatMaybeDate };

export function toKaryawanFormData(karyawan) {
  if (!karyawan) return { ...EMPTY_KARYAWAN_FORM };
  const data = { ...EMPTY_KARYAWAN_FORM };
  for (const key of Object.keys(EMPTY_KARYAWAN_FORM)) {
    data[key] = karyawan[key] ?? EMPTY_KARYAWAN_FORM[key];
  }
  data.tanggal_lahir = toInputDate(karyawan.tanggal_lahir);
  return data;
}

export function toPekerjaanFormData(karyawan) {
  if (!karyawan) return { ...EMPTY_PEKERJAAN_FORM };
  const data = { ...EMPTY_PEKERJAAN_FORM };
  for (const key of Object.keys(EMPTY_PEKERJAAN_FORM)) {
    data[key] = karyawan[key] ?? EMPTY_PEKERJAAN_FORM[key];
  }
  data.tanggal_masuk = toInputDate(karyawan.tanggal_masuk);
  data.tanggal_keluar = toInputDate(karyawan.tanggal_keluar);
  data.branch_id = karyawan.branch_id ?? '';
  return data;
}

export function toFormData(karyawan) {
  return { ...toKaryawanFormData(karyawan), ...toPekerjaanFormData(karyawan) };
}

export function isDraftEmployeeNo(employeeNo) {
  return !employeeNo || String(employeeNo).startsWith('DRAFT/');
}

export function displayEmployeeNo(employeeNo) {
  return isDraftEmployeeNo(employeeNo) ? 'Belum ditetapkan' : employeeNo;
}

export function badgeClass(status) {
  const map = { Aktif: 'badge-aktif', Nonaktif: 'badge-nonaktif', Resign: 'badge-resign', PHK: 'badge-phk' };
  return map[status] || 'badge-nonaktif';
}
