import { useState, useEffect, useCallback } from 'react';
import { attendancesApi, fetchKaryawan } from '../api';
import { formatDate, formatDateTime } from '../constants';
import { attendanceStatusLabel } from '../shiftConstants';

export default function AttendancesPage() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (employeeFilter) params.set('employee_id', employeeFilter);
      if (statusFilter) params.set('status', statusFilter);
      setItems(await attendancesApi.list(params.toString()));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employeeFilter, statusFilter]);

  useEffect(() => { fetchKaryawan().then(setEmployees).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Kehadiran</h1>
          <p>Data kehadiran karyawan dari sistem absensi (bukan input manual)</p>
        </div>
      </div>

      <div className="info-banner">
        Kehadiran diisi otomatis dari mesin/perangkat absensi karyawan. Halaman ini hanya untuk melihat dan memantau data.
      </div>

      {error && <div className="error-banner" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <select className="filter-select" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
          <option value="">Semua Karyawan</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.nama_lengkap} ({e.employee_no})</option>)}
        </select>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="PRESENT">Hadir</option>
          <option value="LATE">Terlambat</option>
          <option value="ABSENT">Tidak Hadir</option>
          <option value="LEAVE">Cuti</option>
          <option value="OFF">Libur</option>
        </select>
      </div>

      <div className="card">
        {loading ? <div className="loading">Memuat data...</div> : items.length === 0 ? (
          <div className="empty-state"><p>Belum ada data kehadiran dari absensi.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Karyawan</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Telat</th>
                  <th>Lembur</th>
                  <th>Status</th>
                  <th>Anomali</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.work_date)}</td>
                    <td>{item.employee_name}</td>
                    <td>{formatDateTime(item.clock_in)}</td>
                    <td>{formatDateTime(item.clock_out)}</td>
                    <td>{item.late_minutes || 0} mnt</td>
                    <td>{item.overtime_minutes || 0} mnt</td>
                    <td><span className="badge badge-type-ktp">{attendanceStatusLabel(item.status)}</span></td>
                    <td>{item.anomaly_flag ? '⚠️' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
