import { useState, useEffect, useCallback } from 'react';
import { attendancesApi, fetchKaryawan } from '../api';
import { formatDate, formatDateTime } from '../constants';
import { EMPTY_ATTENDANCE_FORM, toAttendanceFormData, attendanceStatusLabel } from '../shiftConstants';
import { AttendanceForm } from '../components/ShiftForms';
import { useAuth } from '../context/AuthContext';

export default function AttendancesPage() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_ATTENDANCE_FORM, employee_id: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { canWrite } = useAuth();
  const writable = canWrite('karyawan');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (employeeFilter) params.set('employee_id', employeeFilter);
      if (statusFilter) params.set('status', statusFilter);
      setItems(await attendancesApi.list(params.toString()));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employeeFilter, statusFilter]);

  useEffect(() => { fetchKaryawan().then(setEmployees).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_ATTENDANCE_FORM, employee_id: employeeFilter || '' });
    setError('');
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ ...toAttendanceFormData(item), employee_id: item.employee_id });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        clock_in: form.clock_in ? form.clock_in.replace('T', ' ') : null,
        clock_out: form.clock_out ? form.clock_out.replace('T', ' ') : null,
        schedule_id: form.schedule_id || null,
      };
      if (editing) await attendancesApi.update(editing.id, payload);
      else {
        if (!payload.employee_id) throw new Error('Pilih karyawan terlebih dahulu');
        await attendancesApi.create(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Hapus kehadiran ${formatDate(item.work_date)}?`)) return;
    try {
      await attendancesApi.delete(item.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Kehadiran</h1>
          <p>Kelola data absensi karyawan</p>
        </div>
        {writable && <button className="btn btn-primary" onClick={openCreate}>+ Tambah Kehadiran</button>}
      </div>

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
          <div className="empty-state"><p>Belum ada data kehadiran.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th><th>Karyawan</th><th>Clock In</th><th>Clock Out</th>
                  <th>Telat</th><th>Lembur</th><th>Status</th><th>Anomali</th>
                  {writable && <th>Aksi</th>}
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
                    {writable && (
                      <td>
                        <div className="actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item)}>Hapus</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit' : 'Tambah'} Kehadiran</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {!editing && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Karyawan <span className="required">*</span></label>
                  <select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required>
                    <option value="">Pilih karyawan</option>
                    {employees.map((e) => <option key={e.id} value={e.id}>{e.nama_lengkap}</option>)}
                  </select>
                </div>
              )}
              <AttendanceForm
                form={form}
                onChange={setForm}
                onSubmit={handleSubmit}
                onCancel={() => setModalOpen(false)}
                error={error}
                saving={saving}
                isEdit={!!editing}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
