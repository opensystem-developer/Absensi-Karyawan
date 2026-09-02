import { useState, useEffect } from 'react';
import { companiesApi, branchesApi, departmentsApi, positionsApi, employmentStatusesApi } from '../api';
import { KONTRAK_TYPE_OPTIONS, KONTRAK_STATUS_OPTIONS } from '../kontrakConstants';

function Field({ label, required, children }) {
  return (<div className="form-group"><label>{label}{required && <span className="required"> *</span>}</label>{children}</div>);
}

export default function PosisiForm({ form, onChange, onSubmit, onCancel, error, saving, isEdit }) {
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const set = (f) => (e) => onChange({ ...form, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  useEffect(() => { companiesApi.list().then(setCompanies).catch(() => {}); employmentStatusesApi.list().then(setStatuses).catch(() => {}); }, []);
  useEffect(() => { if (form.company_id) branchesApi.list(`company_id=${form.company_id}`).then(setBranches).catch(() => {}); else setBranches([]); }, [form.company_id]);
  useEffect(() => { if (form.branch_id) departmentsApi.list(`branch_id=${form.branch_id}`).then(setDepartments).catch(() => {}); else setDepartments([]); }, [form.branch_id]);
  useEffect(() => { if (form.department_id) positionsApi.list(`department_id=${form.department_id}`).then(setPositions).catch(() => {}); else setPositions([]); }, [form.department_id]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-grid">
        <Field label="Perusahaan" required><select value={form.company_id} onChange={set('company_id')} required><option value="">Pilih</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Cabang" required><select value={form.branch_id} onChange={set('branch_id')} required><option value="">Pilih</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
        <Field label="Departemen" required><select value={form.department_id} onChange={set('department_id')} required><option value="">Pilih</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
        <Field label="Jabatan" required><select value={form.position_id} onChange={set('position_id')} required><option value="">Pilih</option>{positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Status Kepegawaian" required><select value={form.employment_status_id} onChange={set('employment_status_id')} required><option value="">Pilih</option>{statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Tgl Mulai"><input type="date" value={form.start_date} onChange={set('start_date')} /></Field>
        <Field label="Tgl Akhir"><input type="date" value={form.end_date} onChange={set('end_date')} /></Field>
        <div className="form-group"><label>&nbsp;</label><label className="checkbox-label"><input type="checkbox" checked={form.is_current} onChange={set('is_current')} /> Penempatan aktif</label></div>
        <div className="form-group full-width"><label>Alasan</label><textarea rows={2} value={form.reason} onChange={set('reason')} /></div>
      </div>
      <div className="modal-footer" style={{ padding: '1rem 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah Posisi'}</button>
      </div>
    </form>
  );
}

export function KontrakForm({ form, onChange, onSubmit, onCancel, error, saving, isEdit }) {
  const set = (f) => (e) => onChange({ ...form, [f]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-grid">
        <Field label="No. Kontrak" required><input value={form.contract_no} onChange={set('contract_no')} required /></Field>
        <Field label="Tipe" required><select value={form.type} onChange={set('type')} required>{KONTRAK_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        <Field label="Tgl Mulai"><input type="date" value={form.start_date} onChange={set('start_date')} /></Field>
        <Field label="Tgl Akhir"><input type="date" value={form.end_date} onChange={set('end_date')} /></Field>
        <Field label="Status"><select value={form.status} onChange={set('status')}>{KONTRAK_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
        <Field label="Path Dokumen"><input value={form.document_path} onChange={set('document_path')} placeholder="/docs/kontrak.pdf" /></Field>
      </div>
      <div className="modal-footer" style={{ padding: '1rem 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah Kontrak'}</button>
      </div>
    </form>
  );
}
