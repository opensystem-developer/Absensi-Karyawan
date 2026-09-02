import { useState, useEffect } from 'react';
import { EMPTY_FORM, AGAMA_OPTIONS, STATUS_NIKAH_OPTIONS, STATUS_OPTIONS } from '../constants';
import { branchesApi, previewEmployeeNo } from '../api';
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

export default function KaryawanForm({ form, onChange, onSubmit, onCancel, error, saving, isEdit }) {
  const [branches, setBranches] = useState([]);
  const [previewNo, setPreviewNo] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    branchesApi.list().then(setBranches).catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    if (isEdit) {
      setPreviewNo(form.employee_no || '');
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
  }, [form.branch_id, form.tanggal_masuk, form.employee_no, isEdit]);

  const set = (field) => (e) => onChange({ ...form, [field]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="error-banner">{error}</div>}

      <div className="form-grid">
        <div className="form-section-title">Penempatan & Nomor Karyawan</div>

        <Field label="Cabang" required={!isEdit}>
          {isEdit ? (
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
            value={previewLoading ? 'Menghasilkan...' : (previewNo || '')}
            readOnly
            disabled
            placeholder={form.branch_id ? 'Otomatis: 00001/KODE/BLN/YY' : 'Pilih cabang dulu'}
          />
        </Field>
        {!isEdit && form.branch_id && (
          <div className="form-group full-width">
            <p className="form-hint">Format: <strong>99999/KODE_CABANG/BULAN/TAHUN</strong> (nomor urut digenerate otomatis)</p>
          </div>
        )}

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

        <div className="form-section-title">Kepegawaian</div>

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

      <div className="modal-footer" style={{ padding: '1rem 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={saving || (!isEdit && !form.branch_id)}>
          {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Karyawan'}
        </button>
      </div>
    </form>
  );
}
