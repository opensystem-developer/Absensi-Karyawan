export const EMPTY_KONTAK_FORM = {
  type: 'PERSONAL',
  nama: '',
  hubungan: '',
  nomor_telepon: '',
  is_primary: false,
  keterangan: '',
};

export const KONTAK_TYPE_OPTIONS = ['PERSONAL', 'EMERGENCY'];

export function toKontakFormData(item) {
  if (!item) return { ...EMPTY_KONTAK_FORM };
  return {
    type: item.type || 'PERSONAL',
    nama: item.nama || '',
    hubungan: item.hubungan || '',
    nomor_telepon: item.nomor_telepon || '',
    is_primary: !!item.is_primary,
    keterangan: item.keterangan || '',
  };
}
