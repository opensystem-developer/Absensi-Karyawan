import { ALAMAT_TYPE_OPTIONS } from '../alamatConstants';

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

export default function AlamatForm({ form, onChange, onSubmit, onCancel, error, saving, isEdit }) {
  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange({ ...form, [field]: value });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="error-banner">{error}</div>}

      <div className="form-grid">
        <Field label="Tipe Alamat" required>
          <select value={form.type} onChange={set('type')} required>
            {ALAMAT_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <div className="form-group">
          <label>&nbsp;</label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.is_primary} onChange={set('is_primary')} />
            Alamat utama
          </label>
        </div>
        <div className="form-group full-width">
          <label>Alamat Lengkap <span className="required">*</span></label>
          <textarea rows={2} value={form.alamat} onChange={set('alamat')} required placeholder="Jl. ... No. ..." />
        </div>
        <Field label="RT">
          <input value={form.rt} onChange={set('rt')} maxLength={10} />
        </Field>
        <Field label="RW">
          <input value={form.rw} onChange={set('rw')} maxLength={10} />
        </Field>
        <Field label="Kelurahan">
          <input value={form.kelurahan} onChange={set('kelurahan')} />
        </Field>
        <Field label="Kecamatan">
          <input value={form.kecamatan} onChange={set('kecamatan')} />
        </Field>
        <Field label="Kota/Kabupaten">
          <input value={form.kota} onChange={set('kota')} />
        </Field>
        <Field label="Provinsi">
          <input value={form.provinsi} onChange={set('provinsi')} />
        </Field>
        <Field label="Kode Pos">
          <input value={form.kode_pos} onChange={set('kode_pos')} maxLength={10} />
        </Field>
      </div>

      <div className="modal-footer" style={{ padding: '1rem 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Alamat'}
        </button>
      </div>
    </form>
  );
}
