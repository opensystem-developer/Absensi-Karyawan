import { useState, useEffect, useCallback, useMemo } from 'react';
import { workSchedulesApi, fetchKaryawan } from '../api';
import { formatDate } from '../constants';
import { EMPTY_WORK_SCHEDULE_FORM, toWorkScheduleFormData } from '../shiftConstants';
import { WorkScheduleForm } from '../components/ShiftForms';
import WorkScheduleGrid from '../components/WorkScheduleGrid';
import DisplayColorSettingsModal from '../components/DisplayColorSettingsModal';
import { useDisplayColors } from '../context/DisplayColorContext';
import { useAuth } from '../context/AuthContext';
import { currentMonthKey, monthBounds } from '../utils/scheduleMonth';
import {
  toScheduleGridRow,
  toScheduleGridRows,
  sortScheduleGridRows,
  filterScheduleGridRows,
  collectPositionFilterOptions,
} from '../utils/scheduleGridRow';

export default function WorkSchedulesPage() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [month, setMonth] = useState(currentMonthKey);
  const [modalOpen, setModalOpen] = useState(false);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_WORK_SCHEDULE_FORM, employee_id: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [rowSort, setRowSort] = useState('name');
  const { canWrite } = useAuth();
  const { refresh: refreshColors } = useDisplayColors();
  const writable = canWrite('karyawan');
  const colorWritable = writable || canWrite('master');

  const bounds = useMemo(() => monthBounds(month), [month]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        work_date_from: bounds.from,
        work_date_to: bounds.to,
      });
      setItems(await workSchedulesApi.list(params.toString()));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bounds.from, bounds.to]);

  useEffect(() => {
    fetchKaryawan().then(setEmployees).catch(() => {});
    refreshColors().catch(() => {});
  }, [refreshColors]);
  useEffect(() => { load(); }, [load]);

  const allRows = useMemo(() => {
    const ids = new Set(items.map((i) => i.employee_id));
    return toScheduleGridRows(employees, ids, items);
  }, [employees, items]);

  const positionOptions = useMemo(
    () => collectPositionFilterOptions(allRows),
    [allRows],
  );

  const rows = useMemo(() => {
    const filtered = filterScheduleGridRows(allRows, {
      nameQuery: nameFilter,
      positionCode: positionFilter,
    });
    return sortScheduleGridRows(filtered, rowSort);
  }, [allRows, nameFilter, positionFilter, rowSort]);

  function openCreate(date = bounds.from, employeeId = '') {
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

  const toolbarFilters = (
    <>
      <input
        type="search"
        className="filter-search"
        placeholder="Cari nama / no karyawan..."
        value={nameFilter}
        onChange={(e) => setNameFilter(e.target.value)}
        aria-label="Filter nama karyawan"
      />
      <select
        className="filter-select"
        value={positionFilter}
        onChange={(e) => setPositionFilter(e.target.value)}
        aria-label="Filter jabatan"
      >
        <option value="">Semua Jabatan</option>
        {positionOptions.map((p) => (
          <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
        ))}
      </select>
      <select className="filter-select" value={rowSort} onChange={(e) => setRowSort(e.target.value)} aria-label="Urutkan baris">
        <option value="name">Urut: Nama</option>
        <option value="position">Urut: Jabatan</option>
      </select>
    </>
  );

  const emptyMessage = nameFilter || positionFilter
    ? `Tidak ada jadwal yang cocok dengan filter untuk ${bounds.label}.`
    : `Belum ada jadwal kerja untuk ${bounds.label}.`;

  return (
    <div className="page page-fill page-schedule">
      <div className="page-header page-header-compact">
        <div>
          <h1>Jadwal Kerja</h1>
          <p>Grid jadwal kerja per karyawan dan tanggal (format Excel)</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setColorModalOpen(true)}>
            Pengaturan Warna
          </button>
          {writable && <button className="btn btn-primary" onClick={() => openCreate()}>+ Tambah Jadwal</button>}
        </div>
      </div>

      {error && <div className="error-banner page-schedule-error">{error}</div>}

      <div className="card schedule-page-card">
        <WorkScheduleGrid
          month={month}
          onMonthChange={setMonth}
          rows={rows}
          schedules={items}
          loading={loading}
          writable={writable}
          onCellClick={writable ? handleCellClick : undefined}
          toolbarExtra={toolbarFilters}
          emptyMessage={emptyMessage}
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

      <DisplayColorSettingsModal
        open={colorModalOpen}
        onClose={() => setColorModalOpen(false)}
        writable={colorWritable}
      />
    </div>
  );
}
