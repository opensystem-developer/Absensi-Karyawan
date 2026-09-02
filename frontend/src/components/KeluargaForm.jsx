import { HUBUNGAN_KELUARGA_OPTIONS } from '../keluargaConstants';

function Field({ label, required, children }) {
  return (
    <div className="form-group">
      <label>{label}{required && <span className="required"> *</span>}</label>
      {children}
    </div>
  );
}

export default function KeluargaForm({ form, onChange, onSubmit, onCancel, error, saving, isEdit }) {
  const set = (field) => (e) => onChange({ ...form, [field]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-grid">
        <Field label="Nama" required>
          <input value={form.nama} onChange={set('nama')} required />
        </Field>
        <Field label="Hubungan">
          <select value={form.hubungan} onChange={set('hubungan')}>
            <option value="">Pilih</option>
            {HUBUNGAN_KELUARGA_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </Field>
        <Field label="Jenis Kelamin">
          <select value={form.jenis_kelamin} onChange={set('jenis_kelamin')}>
            <option value="">Pilih</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </Field>
        <Field label="Tanggal Lahir">
          <input type="date" value={form.tanggal_lahir} onChange={set('tanggal_lahir')} />
        </Field>
        <Field label="Pekerjaan">
          <input value={form.pekerjaan} onChange={set('pekerjaan')} />
        </Field>
        <div className="form-group full-width">
          <label>Keterangan</label>
          <textarea rows={2} value={form.keterangan} onChange={set('keterangan')} />
        </div>
      </div>
      <div className="modal-footer" style={{ padding: '1rem 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Keluarga'}
        </button>
      </div>
    </form>
  );
}
