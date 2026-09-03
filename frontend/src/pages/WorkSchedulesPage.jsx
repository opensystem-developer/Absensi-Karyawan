import { useState, useEffect, useCallback, useMemo } from 'react';
import { workSchedulesApi, fetchKaryawan } from '../api';
import { formatDate } from '../constants';
import { EMPTY_WORK_SCHEDULE_FORM, toWorkScheduleFormData, workScheduleStatusLabel } from '../shiftConstants';
import { WorkScheduleForm } from '../components/ShiftForms';
import { useAuth } from '../context/AuthContext';

function monthBounds(ym) {
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return {
    from: `${ym}-01`,
    to: `${ym}-${String(last).padStart(2, '0')}`,
    label: new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
  };
}

function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function WorkSchedulesPage() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_WORK_SCHEDULE_FORM, employee_id: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { canWrite } = useAuth();
  const writable = canWrite('karyawan');

  const bounds = useMemo(() => monthBounds(month), [month]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        work_date_from: bounds.from,
        work_date_to: bounds.to,
      });
      if (employeeFilter) params.set('employee_id', employeeFilter);
      setItems(await workSchedulesApi.list(params.toString()));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employeeFilter, bounds.from, bounds.to]);

  useEffect(() => { fetchKaryawan().then(setEmployees).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_WORK_SCHEDULE_FORM, employee_id: employeeFilter || '', work_date: bounds.from });
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
          <p>Tabel jadwal kerja harian karyawan per bulan</p>
        </div>
        {writable && <button className="btn btn-primary" onClick={openCreate}>+ Tambah Jadwal</button>}
      </div>

      <div className="toolbar schedule-table-toolbar" style={{ marginBottom: '1rem' }}>
        <select className="filter-select" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
          <option value="">Semua Karyawan</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.nama_lengkap} ({e.employee_no})</option>)}
        </select>
        <div className="month-nav">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMonth(shiftMonth(month, -1))}>&larr;</button>
          <span className="month-nav-label">{bounds.label}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMonth(shiftMonth(month, 1))}>&rarr;</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading">Memuat data...</div> : items.length === 0 ? (
          <div className="empty-state"><p>Belum ada jadwal kerja untuk {bounds.label}.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Karyawan</th>
                  <th>No. Karyawan</th>
                  <th>Shift</th>
                  <th>Jam Mulai</th>
                  <th>Jam Selesai</th>
                  <th>Status</th>
                  {writable && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{formatDate(item.work_date)}</strong></td>
                    <td>{item.employee_name}</td>
                    <td className="text-muted">{item.employee_no}</td>
                    <td>{item.shift_name} ({item.shift_code})</td>
                    <td>{item.start_time || item.shift_start || '-'}</td>
                    <td>{item.end_time || item.shift_end || '-'}</td>
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
