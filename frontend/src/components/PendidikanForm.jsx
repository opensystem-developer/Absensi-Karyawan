import { TINGKAT_OPTIONS } from '../pendidikanConstants';

function Field({ label, required, children }) {
  return (
    <div className="form-group">
      <label>{label}{required && <span className="required"> *</span>}</label>
      {children}
    </div>
  );
}

export default function PendidikanForm({ form, onChange, onSubmit, onCancel, error, saving, isEdit }) {
  const set = (field) => (e) => onChange({ ...form, [field]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-grid">
        <Field label="Tingkat" required>
          <select value={form.tingkat} onChange={set('tingkat')} required>
            <option value="">Pilih</option>
            {TINGKAT_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Nama Sekolah" required>
          <input value={form.nama_sekolah} onChange={set('nama_sekolah')} required />
        </Field>
        <Field label="Jurusan">
          <input value={form.jurusan} onChange={set('jurusan')} />
        </Field>
        <Field label="Tahun Lulus">
          <input type="number" min="1950" max="2100" value={form.tahun_lulus} onChange={set('tahun_lulus')} />
        </Field>
        <div className="form-group full-width">
          <label>Keterangan</label>
          <textarea rows={2} value={form.keterangan} onChange={set('keterangan')} />
        </div>
      </div>
      <div className="modal-footer" style={{ padding: '1rem 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Pendidikan'}
        </button>
      </div>
    </form>
  );
}
