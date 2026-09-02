import { KONTAK_TYPE_OPTIONS } from '../kontakConstants';

function Field({ label, required, children }) {
  return (
    <div className="form-group">
      <label>{label}{required && <span className="required"> *</span>}</label>
      {children}
    </div>
  );
}

export default function KontakForm({ form, onChange, onSubmit, onCancel, error, saving, isEdit }) {
  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange({ ...form, [field]: value });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-grid">
        <Field label="Tipe Kontak" required>
          <select value={form.type} onChange={set('type')} required>
            {KONTAK_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Nama Kontak" required>
          <input value={form.nama} onChange={set('nama')} required />
        </Field>
        <Field label="Hubungan">
          <input value={form.hubungan} onChange={set('hubungan')} placeholder="Istri, Ayah, dll" />
        </Field>
        <Field label="Nomor Telepon">
          <input value={form.nomor_telepon} onChange={set('nomor_telepon')} />
        </Field>
        <div className="form-group">
          <label>&nbsp;</label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.is_primary} onChange={set('is_primary')} />
            Kontak utama
          </label>
        </div>
        <div className="form-group full-width">
          <label>Keterangan</label>
          <textarea rows={2} value={form.keterangan} onChange={set('keterangan')} />
        </div>
      </div>
      <div className="modal-footer" style={{ padding: '1rem 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Kontak'}
        </button>
      </div>
    </form>
  );
}
