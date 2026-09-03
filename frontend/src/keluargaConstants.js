import { toInputDate } from './utils/date';

export const EMPTY_KELUARGA_FORM = {
  nama: '',
  hubungan: '',
  jenis_kelamin: '',
  tanggal_lahir: '',
  pekerjaan: '',
  keterangan: '',
};

export const HUBUNGAN_KELUARGA_OPTIONS = ['Istri', 'Suami', 'Anak', 'Ayah', 'Ibu', 'Saudara', 'Lainnya'];

export function toKeluargaFormData(item) {
  if (!item) return { ...EMPTY_KELUARGA_FORM };
  return {
    nama: item.nama || '',
    hubungan: item.hubungan || '',
    jenis_kelamin: item.jenis_kelamin || '',
    tanggal_lahir: toInputDate(item.tanggal_lahir),
    pekerjaan: item.pekerjaan || '',
    keterangan: item.keterangan || '',
  };
}
