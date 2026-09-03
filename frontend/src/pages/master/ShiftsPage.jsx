import CrudPage from '../../components/CrudPage';
import { shiftsApi } from '../../api';

export default function ShiftsPage() {
  return (
    <CrudPage
      title="Shift"
      subtitle="Kelola definisi shift kerja"
      api={shiftsApi}
      columns={[
        { key: 'code', label: 'Kode' },
        { key: 'name', label: 'Nama' },
        { key: 'start_time', label: 'Mulai' },
        { key: 'end_time', label: 'Selesai' },
        { key: 'break_start', label: 'Istirahat' },
        { key: 'late_tolerance_minutes', label: 'Toleransi Telat (mnt)' },
        { key: 'status', label: 'Status', type: 'boolean' },
      ]}
      fields={[
        { name: 'code', label: 'Kode Shift', required: true },
        { name: 'name', label: 'Nama Shift', required: true },
        { name: 'start_time', label: 'Jam Mulai', type: 'time', required: true },
        { name: 'end_time', label: 'Jam Selesai', type: 'time', required: true },
        { name: 'break_start', label: 'Mulai Istirahat', type: 'time' },
        { name: 'break_end', label: 'Selesai Istirahat', type: 'time' },
        { name: 'late_tolerance_minutes', label: 'Toleransi Keterlambatan (menit)', type: 'number', default: 0 },
        { name: 'early_out_tolerance_minutes', label: 'Toleransi Pulang Cepat (menit)', type: 'number', default: 0 },
        { name: 'color_bg', label: 'Warna Tampilan', type: 'color' },
        { name: 'status', label: 'Status', type: 'boolean', default: true },
      ]}
    />
  );
}
