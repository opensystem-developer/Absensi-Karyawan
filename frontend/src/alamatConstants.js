export const EMPTY_ALAMAT_FORM = {
  type: 'KTP',
  alamat: '',
  rt: '',
  rw: '',
  kelurahan: '',
  kecamatan: '',
  kota: '',
  provinsi: '',
  kode_pos: '',
  is_primary: false,
};

export const ALAMAT_TYPE_OPTIONS = ['KTP', 'DOMISILI'];

export function toAlamatFormData(alamat) {
  if (!alamat) return { ...EMPTY_ALAMAT_FORM };
  return {
    type: alamat.type || 'KTP',
    alamat: alamat.alamat || '',
    rt: alamat.rt || '',
    rw: alamat.rw || '',
    kelurahan: alamat.kelurahan || '',
    kecamatan: alamat.kecamatan || '',
    kota: alamat.kota || '',
    provinsi: alamat.provinsi || '',
    kode_pos: alamat.kode_pos || '',
    is_primary: !!alamat.is_primary,
  };
}

export function formatAlamatSingkat(a) {
  const parts = [a.alamat, a.kelurahan, a.kecamatan, a.kota].filter(Boolean);
  return parts.join(', ') || '-';
}
