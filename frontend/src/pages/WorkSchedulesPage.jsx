import { useState, useEffect, useCallback } from 'react';
import { workSchedulesApi, fetchKaryawan } from '../api';
import { formatDate } from '../constants';
import { EMPTY_WORK_SCHEDULE_FORM, toWorkScheduleFormData, workScheduleStatusLabel } from '../shiftConstants';
import { WorkScheduleForm } from '../components/ShiftForms';
import { useAuth } from '../context/AuthContext';

export default function WorkSchedulesPage() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_WORK_SCHEDULE_FORM, employee_id: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { canWrite } = useAuth();
  const writable = canWrite('karyawan');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = employeeFilter ? `employee_id=${employeeFilter}` : '';
      setItems(await workSchedulesApi.list(q));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employeeFilter]);

  useEffect(() => { fetchKaryawan().then(setEmployees).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_WORK_SCHEDULE_FORM, employee_id: employeeFilter || '' });
    setError('');
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ ...toWorkScheduleFormData(item), employee_id: item.employee_id });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (editing) await workSchedulesApi.update(editing.id, payload);
      else {
        if (!payload.employee_id) throw new Error('Pilih karyawan terlebih dahulu');
        await workSchedulesApi.create(payload);
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
    if (!confirm(`Hapus jadwal ${formatDate(item.work_date)}?`)) return;
    try {
      await workSchedulesApi.delete(item.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Jadwal Kerja</h1>
          <p>Kelola jadwal kerja harian karyawan</p>
        </div>
        {writable && <button className="btn btn-primary" onClick={openCreate}>+ Tambah Jadwal</button>}
      </div>

      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <select className="filter-select" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
          <option value="">Semua Karyawan</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.nama_lengkap} ({e.employee_no})</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? <div className="loading">Memuat data...</div> : items.length === 0 ? (
          <div className="empty-state"><p>Belum ada jadwal kerja.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th><th>Karyawan</th><th>Shift</th><th>Jam</th><th>Status</th>
                  {writable && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.work_date)}</td>
                    <td>{item.employee_name}<br /><span className="text-muted">{item.employee_no}</span></td>
                    <td>{item.shift_name} ({item.shift_code})</td>
                    <td>{item.start_time || item.shift_start || '-'} — {item.end_time || item.shift_end || '-'}</td>
                    <td><span className="badge badge-type-ktp">{workScheduleStatusLabel(item.status)}</span></td>
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
              <h2>{editing ? 'Edit' : 'Tambah'} Jadwal Kerja</h2>
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
              <WorkScheduleForm
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
