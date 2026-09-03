import { useState, useEffect, useCallback } from 'react';
import { usersApi, fetchRoles, branchesApi } from '../api';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  username: '',
  password: '',
  full_name: '',
  role_id: '',
  is_active: true,
  branch_scope: 'BRANCH',
  branch_ids: [],
};

function branchSummary(item) {
  if (item.branch_scope === 'ALL') return 'Semua cabang';
  const names = (item.branches || []).map((b) => b.name || b.code).filter(Boolean);
  return names.length ? names.join(', ') : '—';
}

export default function UsersPage() {
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { canWrite } = useAuth();
  const writable = canWrite('users');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await usersApi.list());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles().then(setRoles).catch(() => {});
    branchesApi.list().then(setBranches).catch(() => {});
  }, []);
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
      username: item.username,
      password: '',
      full_name: item.full_name,
      role_id: item.role_id,
      is_active: !!item.is_active,
      branch_scope: item.branch_scope || 'BRANCH',
      branch_ids: item.branch_ids || [],
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
        full_name: form.full_name,
        role_id: form.role_id,
        is_active: !!form.is_active,
        branch_scope: form.branch_scope,
        branch_ids: form.branch_scope === 'ALL' ? [] : form.branch_ids,
      };
      if (!editing) {
        payload.username = form.username;
        payload.password = form.password;
        await usersApi.create(payload);
      } else {
        if (form.password) payload.password = form.password;
        await usersApi.update(editing.id, payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Hapus user "${item.username}"?`)) return;
    try {
      await usersApi.delete(item.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Pengguna</h1>
          <p>Kelola user, role, dan hak akses cabang</p>
        </div>
        {writable && <button className="btn btn-primary" onClick={openCreate}>+ Tambah</button>}
      </div>

      {error && !modalOpen && <div className="error-banner">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading">Memuat data...</div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>Belum ada data pengguna.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Nama</th>
                  <th>Role</th>
                  <th>Akses Cabang</th>
                  <th>Status</th>
                  {writable && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.username}</strong></td>
                    <td>{item.full_name}</td>
                    <td>{item.role_name}</td>
                    <td className="cell-truncate" style={{ maxWidth: 240 }}>{branchSummary(item)}</td>
                    <td>{item.is_active ? 'Aktif' : 'Nonaktif'}</td>
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
              <h2>{editing ? 'Edit' : 'Tambah'} Pengguna</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-banner">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  {!editing && (
                    <div className="form-group">
                      <label>Username <span className="required">*</span></label>
                      <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                    </div>
                  )}
                  <div className="form-group">
                    <label>{editing ? 'Password baru' : 'Password'} {!editing && <span className="required">*</span>}</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required={!editing}
                      placeholder={editing ? 'Kosongkan jika tidak diubah' : ''}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nama Lengkap <span className="required">*</span></label>
                    <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Role <span className="required">*</span></label>
                    <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} required>
                      <option value="">Pilih role</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.is_active ? '1' : '0'} onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })}>
                      <option value="1">Aktif</option>
                      <option value="0">Nonaktif</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Akses Data Cabang <span className="required">*</span></label>
                    <div className="scope-options">
                      <label className="radio-card">
                        <input
                          type="radio"
                          name="branch_scope"
                          value="ALL"
                          checked={form.branch_scope === 'ALL'}
                          onChange={() => setForm({ ...form, branch_scope: 'ALL', branch_ids: [] })}
                        />
                        <div>
                          <strong>Semua Cabang</strong>
                          <p>User dapat melihat data dari seluruh cabang</p>
                        </div>
                      </label>
                      <label className="radio-card">
                        <input
                          type="radio"
                          name="branch_scope"
                          value="BRANCH"
                          checked={form.branch_scope === 'BRANCH'}
                          onChange={() => setForm({ ...form, branch_scope: 'BRANCH' })}
                        />
                        <div>
                          <strong>Cabang Tertentu</strong>
                          <p>User hanya dapat melihat data cabang yang dipilih</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {form.branch_scope === 'BRANCH' && (
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
