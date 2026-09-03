import { useState, useEffect, useCallback, useMemo } from 'react';
import { shiftsApi } from '../api';
import {
  EMPTY_WORK_SCHEDULE_FORM, toWorkScheduleFormData,
} from '../shiftConstants';
import { WorkScheduleForm } from './ShiftForms';
import WorkScheduleGrid from './WorkScheduleGrid';
import { currentMonthKey, monthBounds } from '../utils/scheduleMonth';

export default function WorkScheduleTable({
  employeeId,
  employeeName = 'Karyawan',
  employeeNo = '',
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  writable = true,
}) {
  const [items, setItems] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonthKey);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_WORK_SCHEDULE_FORM });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const bounds = useMemo(() => monthBounds(month), [month]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFn(employeeId);
      setItems(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employeeId, fetchFn]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { shiftsApi.list().then(setShifts).catch(() => {}); }, []);

  const monthItems = useMemo(() => (
    items.filter((i) => i.work_date >= bounds.from && i.work_date <= bounds.to)
  ), [items, bounds.from, bounds.to]);

  const rows = useMemo(() => ([{
    id: employeeId,
    name: employeeName,
    subtitle: employeeNo || undefined,
  }]), [employeeId, employeeName, employeeNo]);

  function openCreate(date = bounds.from) {
    setEditingId(null);
    setForm({ ...EMPTY_WORK_SCHEDULE_FORM, work_date: date });
    setError('');
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm(toWorkScheduleFormData(item));
    setError('');
    setShowForm(true);
  }

  function handleCellClick(_row, item, date) {
    if (item) openEdit(item);
    else openCreate(date);
  }

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      if (editingId) await updateFn(employeeId, editingId, form);
      else await createFn(employeeId, form);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (showForm && writable) {
    return (
      <>
        <button type="button" className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }} onClick={() => setShowForm(false)}>
          &larr; Kembali ke Jadwal
        </button>
        <WorkScheduleForm
          form={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          error={error}
          saving={saving}
          isEdit={!!editingId}
        />
      </>
    );
  }

  return (
    <>
      <div className="schedule-table-toolbar" style={{ marginBottom: '0.75rem' }}>
        {writable && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openCreate()}>
            + Tambah Jadwal
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <WorkScheduleGrid
        month={month}
        onMonthChange={setMonth}
        rows={rows}
        schedules={monthItems}
        shifts={shifts}
        loading={loading}
        writable={writable}
        onCellClick={writable ? handleCellClick : undefined}
        emptyMessage={`Belum ada jadwal untuk ${bounds.label}. Klik sel tanggal atau tombol Tambah Jadwal.`}
      />
    </>
  );
}
