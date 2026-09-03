import { useState, useEffect, useCallback, useMemo } from 'react';
import { attendancesApi, fetchKaryawan } from '../api';
import AttendanceGrid from '../components/AttendanceGrid';
import DisplayColorSettingsModal from '../components/DisplayColorSettingsModal';
import { useAuth } from '../context/AuthContext';
import { currentMonthKey, monthBounds } from '../utils/scheduleMonth';
import { toScheduleGridRow, toScheduleGridRows } from '../utils/scheduleGridRow';

export default function AttendancesPage() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [month, setMonth] = useState(currentMonthKey);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [error, setError] = useState('');
  const { canWrite } = useAuth();
  const writable = canWrite('karyawan') || canWrite('master');

  const bounds = useMemo(() => monthBounds(month), [month]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        work_date_from: bounds.from,
        work_date_to: bounds.to,
      });
      if (employeeFilter) params.set('employee_id', employeeFilter);
      if (statusFilter) params.set('status', statusFilter);
      setItems(await attendancesApi.list(params.toString()));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employeeFilter, statusFilter, bounds.from, bounds.to]);

  useEffect(() => { fetchKaryawan().then(setEmployees).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    if (employeeFilter) {
      const emp = employees.find((e) => String(e.id) === String(employeeFilter));
      return emp ? [toScheduleGridRow(emp)] : [];
    }

    const ids = new Set(items.map((i) => i.employee_id));
    return toScheduleGridRows(employees, ids);
  }, [employeeFilter, employees, items]);

  const employeeFilterSelect = (
    <select className="filter-select" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
      <option value="">Semua Karyawan</option>
      {employees.map((e) => <option key={e.id} value={e.id}>{e.nama_lengkap} ({e.employee_no})</option>)}
    </select>
  );

  const statusFilterSelect = (
    <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
      <option value="">Semua Status</option>
      <option value="PRESENT">Hadir</option>
      <option value="LATE">Terlambat</option>
      <option value="ABSENT">Tidak Hadir</option>
      <option value="LEAVE">Cuti</option>
      <option value="OFF">Libur</option>
    </select>
  );

  return (
    <div className="page page-fill page-schedule">
      <div className="page-header page-header-compact">
        <div>
          <h1>Kehadiran</h1>
          <p>Laporan kehadiran dari absensi — grid per karyawan dan tanggal</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setColorModalOpen(true)}>
            Pengaturan Warna
          </button>
        </div>
      </div>

      <div className="info-banner page-schedule-error">
        Data kehadiran diisi otomatis dari mesin/perangkat absensi. Halaman ini untuk memantau laporan kehadiran.
      </div>

      {error && <div className="error-banner page-schedule-error">{error}</div>}

      <div className="card schedule-page-card">
        <AttendanceGrid
          month={month}
          onMonthChange={setMonth}
          rows={rows}
          attendances={items}
          loading={loading}
          toolbarExtra={<>{employeeFilterSelect}{statusFilterSelect}</>}
          emptyMessage={`Belum ada data kehadiran untuk ${bounds.label}.`}
          fitMonth
        />
      </div>

      <DisplayColorSettingsModal
        open={colorModalOpen}
        onClose={() => setColorModalOpen(false)}
        writable={writable}
      />
    </div>
  );
}
