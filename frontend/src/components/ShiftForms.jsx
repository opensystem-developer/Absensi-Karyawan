import { useState, useEffect } from 'react';
import { shiftsApi } from '../api';
import { WORK_SCHEDULE_STATUS_OPTIONS, ATTENDANCE_STATUS_OPTIONS } from '../shiftConstants';
import DateInput from './DateInput';

function Field({ label, required, children, hint }) {
  return (
    <div className="form-group">
      <label>{label}{required && <span className="required"> *</span>}</label>
      {children}
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}

export function EmployeeShiftForm({ form, onChange, onSubmit, onCancel, error, saving, isEdit }) {
  const [shifts, setShifts] = useState([]);
  const set = (f) => (e) => onChange({ ...form, [f]: e.target.value });

  useEffect(() => { shiftsApi.list().then(setShifts).catch(() => {}); }, []);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-grid">
        <Field label="Shift" required>
          <select value={form.shift_id} onChange={set('shift_id')} required>
            <option value="">Pilih shift</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code}) — {s.start_time}-{s.end_time}</option>
            ))}
          </select>
        </Field>
        <Field label="Berlaku Dari" required>
          <DateInput value={form.effective_from} onChange={set('effective_from')} required />
        </Field>
        <Field label="Berlaku Sampai">
          <DateInput value={form.effective_to} onChange={set('effective_to')} />
        </Field>
      </div>
      <div className="modal-footer" style={{ padding: '1rem 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}</button>
      </div>
    </form>
  );
}

export function WorkScheduleForm({ form, onChange, onSubmit, onCancel, error, saving, isEdit }) {
  const [shifts, setShifts] = useState([]);
  const set = (f) => (e) => onChange({ ...form, [f]: e.target.value });

  useEffect(() => { shiftsApi.list().then(setShifts).catch(() => {}); }, []);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-grid">
        <Field label="Tanggal Kerja" required>
          <DateInput value={form.work_date} onChange={set('work_date')} required />
        </Field>
        <Field label="Shift" required>
          <select value={form.shift_id} onChange={set('shift_id')} required>
            <option value="">Pilih shift</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={set('status')}>
            {WORK_SCHEDULE_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Override Jam Mulai" hint="Kosongkan untuk pakai jam shift default">
          <input type="time" value={form.start_time} onChange={set('start_time')} />
        </Field>
        <Field label="Override Jam Selesai">
          <input type="time" value={form.end_time} onChange={set('end_time')} />
        </Field>
      </div>
      <div className="modal-footer" style={{ padding: '1rem 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}</button>
      </div>
    </form>
  );
}

export function AttendanceForm({ form, onChange, onSubmit, onCancel, error, saving, isEdit, schedules = [] }) {
  const set = (f) => (e) => onChange({
    ...form,
    [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-grid">
        <Field label="Tanggal Absensi" required>
          <DateInput value={form.work_date} onChange={set('work_date')} required />
        </Field>
        <Field label="Jadwal Kerja">
          <select value={form.schedule_id} onChange={set('schedule_id')}>
            <option value="">Tidak terhubung jadwal</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>{s.work_date} — {s.shift_name || s.shift_code} ({s.status})</option>
            ))}
          </select>
        </Field>
        <Field label="Clock In">
          <input type="datetime-local" value={form.clock_in} onChange={set('clock_in')} />
        </Field>
        <Field label="Clock Out">
          <input type="datetime-local" value={form.clock_out} onChange={set('clock_out')} />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={set('status')}>
            {ATTENDANCE_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Terlambat (menit)">
          <input type="number" min="0" value={form.late_minutes} onChange={set('late_minutes')} />
        </Field>
        <Field label="Pulang Cepat (menit)">
          <input type="number" min="0" value={form.early_out_minutes} onChange={set('early_out_minutes')} />
        </Field>
        <Field label="Lembur (menit)">
          <input type="number" min="0" value={form.overtime_minutes} onChange={set('overtime_minutes')} />
        </Field>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={form.anomaly_flag} onChange={set('anomaly_flag')} />
            Ada anomali
          </label>
        </div>
        <div className="form-group full-width">
          <label>Alasan Anomali</label>
          <textarea rows={2} value={form.anomaly_reason} onChange={set('anomaly_reason')} />
        </div>
      </div>
      <div className="modal-footer" style={{ padding: '1rem 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}</button>
      </div>
    </form>
  );
}
