import { useState, useEffect } from 'react';
import { EMPTY_PEKERJAAN_FORM, STATUS_OPTIONS } from '../constants';
import { branchesApi, previewEmployeeNo } from '../api';
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

export function PekerjaanFormFields({ form, onChange, isEdit, readOnly = false, hasEmployeeNo = false }) {
  const [branches, setBranches] = useState([]);
  const [previewNo, setPreviewNo] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    branchesApi.list().then(setBranches).catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    if (hasEmployeeNo && form.employee_no && !String(form.employee_no).startsWith('DRAFT/')) {
      setPreviewNo(form.employee_no);
      return;
    }
    if (!form.branch_id) {
      setPreviewNo('');
      return;
    }
    setPreviewLoading(true);
    previewEmployeeNo(form.branch_id, form.tanggal_masuk || '')
      .then((res) => setPreviewNo(res.employee_no))
      .catch(() => setPreviewNo(''))
      .finally(() => setPreviewLoading(false));
  }, [form.branch_id, form.tanggal_masuk, form.employee_no, hasEmployeeNo]);

  const set = (field) => (e) => onChange({ ...form, [field]: e.target.value });

  return (
    <fieldset disabled={readOnly} className="form-fieldset">
      <div className="form-grid">
        <div className="form-section-title">Penempatan & Nomor Karyawan</div>

        <Field label="Cabang" required={!hasEmployeeNo}>
          {hasEmployeeNo ? (
            <input value={branches.find((b) => b.id === form.branch_id)?.name || form.branch_id || '-'} readOnly disabled />
          ) : (
            <select value={form.branch_id} onChange={set('branch_id')} required>
              <option value="">Pilih cabang terlebih dahulu</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Nomor Karyawan" required>
          <input
            value={previewLoading ? 'Menghasilkan...' : (previewNo || (hasEmployeeNo ? form.employee_no : '') || '')}
            readOnly
            disabled
            placeholder={form.branch_id ? 'Otomatis: 00001/KODE/BLN/YY' : 'Pilih cabang dulu'}
          />
        </Field>
        {!hasEmployeeNo && form.branch_id && (
          <div className="form-group full-width">
            <p className="form-hint">Format: <strong>99999/KODE_CABANG/BULAN/TAHUN</strong> (nomor urut digenerate otomatis)</p>
          </div>
        )}

        <div className="form-section-title">Status Kepegawaian</div>

        <Field label="Tanggal Masuk">
          <DateInput value={form.tanggal_masuk} onChange={set('tanggal_masuk')} />
        </Field>
        <Field label="Tanggal Keluar">
          <DateInput value={form.tanggal_keluar} onChange={set('tanggal_keluar')} />
        </Field>
        <Field label="Status Karyawan">
          <select value={form.status_karyawan} onChange={set('status_karyawan')}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Alasan Keluar">
          <input value={form.alasan_keluar} onChange={set('alasan_keluar')} />
        </Field>
        <div className="form-group full-width">
          <label>Keterangan</label>
          <textarea rows={3} value={form.keterangan} onChange={set('keterangan')} />
        </div>
      </div>
    </fieldset>
  );
}

export default function PekerjaanForm({ form, onChange, onSubmit, onCancel, error, saving, hasEmployeeNo }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="error-banner">{error}</div>}
      <PekerjaanFormFields form={form} onChange={onChange} hasEmployeeNo={hasEmployeeNo} />
      <div className="modal-footer" style={{ padding: '1rem 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={saving || (!hasEmployeeNo && !form.branch_id)}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}
