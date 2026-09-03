import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDate, toInputDate } from '../utils/date';
import DateInput from './DateInput';

export default function CrudPage({ title, subtitle, api, columns, fields, canWrite = true, filterBar }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const { canWrite: authCanWrite } = useAuth();
  const writable = canWrite && authCanWrite(fields?.[0]?.perm?.split(':')[0] || 'master');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.list(filterQuery);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, filterQuery]);

  useEffect(() => { load(); }, [load]);

  function emptyForm() {
    const f = {};
    for (const field of fields) f[field.name] = field.default ?? (field.type === 'boolean' ? true : '');
    return f;
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setError('');
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    const f = emptyForm();
    for (const field of fields) {
      let val = item[field.name];
      if (field.type === 'boolean') val = !!val;
      if (field.type === 'date' && val) val = toInputDate(val);
      f[field.name] = val ?? '';
    }
    setForm(f);
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      for (const field of fields) {
        if (field.type === 'boolean') payload[field.name] = !!payload[field.name];
        if (field.type === 'number' && payload[field.name] !== '') payload[field.name] = parseInt(payload[field.name], 10);
      }
      if (editing) await api.update(editing.id, payload);
      else await api.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const label = item.name || item.nama_lengkap || item.code || item.username || item.id;
    if (!confirm(`Hapus "${label}"?`)) return;
    try {
      await api.delete(item.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  function renderCell(col, item) {
    if (col.render) return col.render(item);
    const val = item[col.key];
    if (col.type === 'boolean') return val ? 'Aktif' : 'Nonaktif';
    if (col.type === 'date') return formatDate(val);
    return val ?? '-';
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {writable && <button className="btn btn-primary" onClick={openCreate}>+ Tambah</button>}
      </div>

      {filterBar && filterBar(filterQuery, setFilterQuery)}

      <div className="card">
        {loading ? (
          <div className="loading">Memuat data...</div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>Belum ada data.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}{writable && <th>Aksi</th>}</tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    {columns.map((c) => <td key={c.key}>{renderCell(c, item)}</td>)}
                    {writable && (
                      <td>
                        <div className="actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item)}>Hapus</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit' : 'Tambah'} {title}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-banner">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  {fields.map((field) => (
                    <div key={field.name} className={`form-group ${field.fullWidth ? 'full-width' : ''}`}>
                      <label>{field.label}{field.required && <span className="required"> *</span>}</label>
                      {field.type === 'select' ? (
                        <select value={form[field.name]} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} required={field.required}>
                          <option value="">Pilih</option>
                          {(field.options || []).map((o) => (
                            <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea rows={3} value={form[field.name]} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />
                      ) : field.type === 'boolean' ? (
                        <select value={form[field.name] ? '1' : '0'} onChange={(e) => setForm({ ...form, [field.name]: e.target.value === '1' })}>
                          <option value="1">Aktif</option>
                          <option value="0">Nonaktif</option>
                        </select>
                      ) : field.type === 'date' ? (
                        <DateInput
                          value={form[field.name]}
                          onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                          required={field.required}
                        />
                      ) : field.type === 'time' ? (
                        <input
                          type="time"
                          value={form[field.name]}
                          onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                          required={field.required}
                        />
                      ) : field.type === 'color' ? (
                        <input
                          type="color"
                          className="color-picker-simple"
                          value={form[field.name] || '#dbeafe'}
                          onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                        />
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={form[field.name]}
                          onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
