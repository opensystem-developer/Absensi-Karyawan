import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDate } from '../constants';
import {
  EMPTY_WORK_SCHEDULE_FORM, toWorkScheduleFormData, workScheduleStatusLabel,
} from '../shiftConstants';
import { WorkScheduleForm } from './ShiftForms';

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

export default function WorkScheduleTable({
  employeeId,
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  writable = true,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
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

  const monthItems = useMemo(() => {
    return items
      .filter((i) => i.work_date >= bounds.from && i.work_date <= bounds.to)
      .sort((a, b) => a.work_date.localeCompare(b.work_date));
  }, [items, bounds.from, bounds.to]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_WORK_SCHEDULE_FORM, work_date: bounds.from });
    setError('');
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm(toWorkScheduleFormData(item));
    setError('');
    setShowForm(true);
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

  async function handleDelete(item) {
    if (!confirm(`Hapus jadwal ${formatDate(item.work_date)}?`)) return;
    try {
      await deleteFn(employeeId, item.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (showForm && writable) {
    return (
      <>
        <button type="button" className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }} onClick={() => setShowForm(false)}>
          &larr; Kembali ke Tabel
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
      <div className="schedule-table-toolbar">
        <div className="month-nav">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Bulan sebelumnya">
            &larr;
          </button>
          <span className="month-nav-label">{bounds.label}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Bulan berikutnya">
            &rarr;
          </button>
        </div>
        {writable && (
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>+ Tambah Jadwal</button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">Memuat jadwal...</div>
      ) : monthItems.length === 0 ? (
        <div className="empty-state">
          <p>Belum ada jadwal untuk {bounds.label}.</p>
          {writable && (
            <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}>
              Tambah Jadwal
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Shift</th>
                <th>Jam Mulai</th>
                <th>Jam Selesai</th>
                <th>Status</th>
                {writable && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {monthItems.map((item) => (
                <tr key={item.id}>
                  <td><strong>{formatDate(item.work_date)}</strong></td>
                  <td>{item.shift_name} <span className="text-muted">({item.shift_code})</span></td>
                  <td>{item.start_time || item.shift_start || '-'}</td>
                  <td>{item.end_time || item.shift_end || '-'}</td>
                  <td>
                    <span className="badge badge-type-ktp">{workScheduleStatusLabel(item.status)}</span>
                  </td>
                  {writable && (
                    <td>
                      <div className="actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(item)}>Hapus</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
