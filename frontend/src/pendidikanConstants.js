export const EMPTY_PENDIDIKAN_FORM = {
  tingkat: '',
  nama_sekolah: '',
  jurusan: '',
  tahun_lulus: '',
  keterangan: '',
};

export const TINGKAT_OPTIONS = ['SD', 'SMP', 'SMA', 'SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3', 'Lainnya'];

export function toPendidikanFormData(item) {
  if (!item) return { ...EMPTY_PENDIDIKAN_FORM };
  return {
    tingkat: item.tingkat || '',
    nama_sekolah: item.nama_sekolah || '',
    jurusan: item.jurusan || '',
    tahun_lulus: item.tahun_lulus || '',
    keterangan: item.keterangan || '',
  };
}
