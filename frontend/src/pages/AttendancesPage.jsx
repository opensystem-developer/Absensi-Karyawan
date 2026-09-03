import { useState, useEffect, useCallback, useMemo } from 'react';
import { attendancesApi, fetchKaryawan } from '../api';
import AttendanceGrid from '../components/AttendanceGrid';
import DisplayColorSettingsModal from '../components/DisplayColorSettingsModal';
import { useAuth } from '../context/AuthContext';
import { currentMonthKey, monthBounds } from '../utils/scheduleMonth';
import { toScheduleGridRow, toScheduleGridRows, sortScheduleGridRows } from '../utils/scheduleGridRow';

export default function AttendancesPage() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [month, setMonth] = useState(currentMonthKey);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [error, setError] = useState('');
  const { canWrite, user } = useAuth();
  const writable = canWrite('karyawan') || canWrite('master');
  const accessibleBranches = user?.branches || [];

  const bounds = useMemo(() => monthBounds(month), [month]);

  const loadEmployees = useCallback(async () => {
    const params = {};
    if (branchFilter) params.branch_id = branchFilter;
    return fetchKaryawan(params);
  }, [branchFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        work_date_from: bounds.from,
        work_date_to: bounds.to,
      });
      if (employeeFilter) params.set('employee_id', employeeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (branchFilter) params.set('branch_id', branchFilter);
      const [attendanceItems, employeeItems] = await Promise.all([
        attendancesApi.list(params.toString()),
        loadEmployees(),
      ]);
      setItems(attendanceItems);
      setEmployees(employeeItems);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employeeFilter, statusFilter, branchFilter, bounds.from, bounds.to, loadEmployees]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    if (employeeFilter) {
      const emp = employees.find((e) => String(e.id) === String(employeeFilter));
      const positionItem = items.find((i) => String(i.employee_id) === String(employeeFilter));
      return emp ? [toScheduleGridRow(emp, positionItem ? {
        position_code: positionItem.position_code,
        position_name: positionItem.position_name,
      } : null)] : [];
    }

    const ids = new Set(items.map((i) => i.employee_id));
    return sortScheduleGridRows(toScheduleGridRows(employees, ids, items), 'name');
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

  const branchFilterSelect = accessibleBranches.length > 1 ? (
    <select className="filter-select" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} aria-label="Filter cabang">
      <option value="">Semua Cabang</option>
      {accessibleBranches.map((b) => (
        <option key={b.id} value={b.id}>{b.code} — {b.name}</option>
      ))}
    </select>
  ) : null;

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
          toolbarExtra={<>{employeeFilterSelect}{statusFilterSelect}{branchFilterSelect}</>}
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
