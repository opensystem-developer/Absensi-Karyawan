import { useState, useEffect } from 'react';
import { EMPTY_KARYAWAN_FORM, AGAMA_OPTIONS, STATUS_NIKAH_OPTIONS } from '../constants';
import DateInput from './DateInput';

function Field({ label, required, children }) {
  return (
    <div className="form-group">
      <label>
        {label}
        {required && <span className="required"> *</span>}
      </label>
      {children}
    </div>
  );
}

export function KaryawanFormFields({ form, onChange, readOnly = false }) {
  const set = (field) => (e) => onChange({ ...form, [field]: e.target.value });

  return (
    <fieldset disabled={readOnly} className="form-fieldset">
      <div className="form-grid">
        <div className="form-section-title">Data Identitas</div>

        <Field label="NIK KTP" required>
          <input value={form.nik} onChange={set('nik')} required maxLength={20} placeholder="3201..." />
        </Field>
        <Field label="Nama Lengkap" required>
          <input value={form.nama_lengkap} onChange={set('nama_lengkap')} required />
        </Field>
        <Field label="Nama Panggilan">
          <input value={form.nama_panggilan} onChange={set('nama_panggilan')} />
        </Field>
        <Field label="Jenis Kelamin">
          <select value={form.jenis_kelamin} onChange={set('jenis_kelamin')}>
            <option value="">Pilih</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </Field>
        <Field label="Tempat Lahir">
          <input value={form.tempat_lahir} onChange={set('tempat_lahir')} />
        </Field>
        <Field label="Tanggal Lahir">
          <DateInput value={form.tanggal_lahir} onChange={set('tanggal_lahir')} />
        </Field>
        <Field label="Agama">
          <select value={form.agama} onChange={set('agama')}>
            <option value="">Pilih</option>
            {AGAMA_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Status Pernikahan">
          <select value={form.status_pernikahan} onChange={set('status_pernikahan')}>
            <option value="">Pilih</option>
            {STATUS_NIKAH_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Jumlah Anak">
          <input type="number" min="0" value={form.jumlah_anak} onChange={set('jumlah_anak')} />
        </Field>

        <div className="form-section-title">Dokumen & BPJS</div>

        <Field label="Nomor KK">
          <input value={form.no_kk} onChange={set('no_kk')} />
        </Field>
        <Field label="NPWP">
          <input value={form.npwp} onChange={set('npwp')} />
        </Field>
        <Field label="BPJS Kesehatan">
          <input value={form.no_bpjs_kesehatan} onChange={set('no_bpjs_kesehatan')} />
        </Field>
        <Field label="BPJS Ketenagakerjaan">
          <input value={form.no_bpjs_tk} onChange={set('no_bpjs_tk')} />
        </Field>
      </div>
    </fieldset>
  );
}

export default function KaryawanForm({ form, onChange, onSubmit, onCancel, error, saving }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="error-banner">{error}</div>}
      <KaryawanFormFields form={form} onChange={onChange} />
      <div className="modal-footer" style={{ padding: '1rem 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}
