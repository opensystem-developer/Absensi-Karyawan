import { useState, useEffect, useCallback, useMemo } from 'react';
import { workSchedulesApi, fetchKaryawan, shiftsApi } from '../api';
import { formatDate } from '../constants';
import { EMPTY_WORK_SCHEDULE_FORM, toWorkScheduleFormData } from '../shiftConstants';
import { WorkScheduleForm } from '../components/ShiftForms';
import WorkScheduleGrid from '../components/WorkScheduleGrid';
import { useAuth } from '../context/AuthContext';
import { currentMonthKey, monthBounds } from '../utils/scheduleMonth';

export default function WorkSchedulesPage() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [month, setMonth] = useState(currentMonthKey);
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
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employeeFilter, bounds.from, bounds.to]);

  useEffect(() => {
    fetchKaryawan().then(setEmployees).catch(() => {});
    shiftsApi.list().then(setShifts).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    if (employeeFilter) {
      const emp = employees.find((e) => String(e.id) === String(employeeFilter));
      if (!emp) return [];
      return [{ id: emp.id, name: emp.nama_lengkap, subtitle: emp.employee_no }];
    }

    const ids = new Set(items.map((i) => i.employee_id));
    return employees
      .filter((e) => ids.has(e.id))
      .map((e) => ({ id: e.id, name: e.nama_lengkap, subtitle: e.employee_no }))
      .sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }, [employeeFilter, employees, items]);

  function openCreate(date = bounds.from, employeeId = employeeFilter || '') {
    setEditing(null);
    setForm({ ...EMPTY_WORK_SCHEDULE_FORM, employee_id: employeeId, work_date: date });
    setError('');
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ ...toWorkScheduleFormData(item), employee_id: item.employee_id });
    setError('');
    setModalOpen(true);
  }

  function handleCellClick(row, item, date) {
    if (item) openEdit(item);
    else openCreate(date, row.id);
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

  const employeeFilterSelect = (
    <select className="filter-select" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
      <option value="">Semua Karyawan</option>
      {employees.map((e) => <option key={e.id} value={e.id}>{e.nama_lengkap} ({e.employee_no})</option>)}
    </select>
  );

  return (
    <div className="page page-fill page-schedule">
      <div className="page-header page-header-compact">
        <div>
          <h1>Jadwal Kerja</h1>
          <p>Grid jadwal kerja per karyawan dan tanggal (format Excel)</p>
        </div>
        {writable && <button className="btn btn-primary" onClick={() => openCreate()}>+ Tambah Jadwal</button>}
      </div>

      {error && <div className="error-banner page-schedule-error">{error}</div>}

      <div className="card schedule-page-card">
        <WorkScheduleGrid
          month={month}
          onMonthChange={setMonth}
          rows={rows}
          schedules={items}
          shifts={shifts}
          loading={loading}
          writable={writable}
          onCellClick={writable ? handleCellClick : undefined}
          toolbarExtra={employeeFilterSelect}
          emptyMessage={`Belum ada jadwal kerja untuk ${bounds.label}.`}
          fitMonth
        />
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
              {editing && (
                <p className="text-muted" style={{ marginBottom: '1rem' }}>
                  {editing.employee_name} · {formatDate(editing.work_date)}
                </p>
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
