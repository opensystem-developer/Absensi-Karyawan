import { useState, useEffect, useCallback } from 'react';
import { departmentsApi, branchesApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = {
  code: '',
  name: '',
  scope: 'BRANCH',
  branch_ids: [],
  status: true,
};

export default function DepartmentsPage() {
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { canWrite } = useAuth();
  const writable = canWrite('master');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await departmentsApi.list(branchFilter ? `branch_id=${branchFilter}` : '');
      setItems(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [branchFilter]);

  useEffect(() => { branchesApi.list().then(setBranches).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, branch_ids: [] });
    setError('');
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      scope: item.scope || 'BRANCH',
      branch_ids: item.branch_ids || [],
      status: !!item.status,
    });
    setError('');
    setModalOpen(true);
  }

  function toggleBranch(branchId) {
    const id = parseInt(branchId, 10);
    setForm((prev) => {
      const ids = prev.branch_ids.includes(id)
        ? prev.branch_ids.filter((x) => x !== id)
        : [...prev.branch_ids, id];
      return { ...prev, branch_ids: ids };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        branch_ids: form.scope === 'ALL' ? [] : form.branch_ids,
        status: !!form.status,
      };
      if (editing) await departmentsApi.update(editing.id, payload);
      else await departmentsApi.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Hapus departemen "${item.name}"?`)) return;
    try {
      await departmentsApi.delete(item.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Departemen</h1>
          <p>Kelola departemen untuk semua cabang atau cabang tertentu</p>
        </div>
        {writable && <button className="btn btn-primary" onClick={openCreate}>+ Tambah</button>}
      </div>

      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <select className="filter-select" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="">Semua Cabang</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Memuat data...</div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>Belum ada data departemen.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama</th>
                  <th>Cakupan</th>
                  <th>Cabang</th>
                  <th>Status</th>
                  {writable && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.code}</strong></td>
                    <td>{item.name}</td>
                    <td><span className={`badge ${item.scope === 'ALL' ? 'badge-type-ktp' : 'badge-type-domisili'}`}>{item.scope_label}</span></td>
                    <td className="cell-truncate" style={{ maxWidth: 240 }}>{item.branch_names}</td>
                    <td>{item.status ? 'Aktif' : 'Nonaktif'}</td>
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
              <h2>{editing ? 'Edit' : 'Tambah'} Departemen</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-banner">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Kode <span className="required">*</span></label>
                    <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Nama Departemen <span className="required">*</span></label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>

                  <div className="form-group full-width">
                    <label>Cakupan Cabang <span className="required">*</span></label>
                    <div className="scope-options">
                      <label className="radio-card">
                        <input
                          type="radio"
                          name="scope"
                          value="ALL"
                          checked={form.scope === 'ALL'}
                          onChange={() => setForm({ ...form, scope: 'ALL', branch_ids: [] })}
                        />
                        <div>
                          <strong>Semua Cabang</strong>
                          <p>Departemen ini bisa dipakai di seluruh cabang</p>
                        </div>
                      </label>
                      <label className="radio-card">
                        <input
                          type="radio"
                          name="scope"
                          value="BRANCH"
                          checked={form.scope === 'BRANCH'}
                          onChange={() => setForm({ ...form, scope: 'BRANCH' })}
                        />
                        <div>
                          <strong>Cabang Tertentu</strong>
                          <p>Departemen hanya tersedia di cabang yang dipilih</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {form.scope === 'BRANCH' && (
                    <div className="form-group full-width">
                      <label>Pilih Cabang <span className="required">*</span></label>
                      <div className="checkbox-list">
                        {branches.length === 0 ? (
                          <p className="form-hint">Belum ada data cabang.</p>
                        ) : branches.map((b) => (
                          <label key={b.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={form.branch_ids.includes(b.id)}
                              onChange={() => toggleBranch(b.id)}
                            />
                            {b.name} ({b.code})
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status ? '1' : '0'} onChange={(e) => setForm({ ...form, status: e.target.value === '1' })}>
                      <option value="1">Aktif</option>
                      <option value="0">Nonaktif</option>
                    </select>
                  </div>
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
