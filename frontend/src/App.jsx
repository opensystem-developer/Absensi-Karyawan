import { useState, useEffect, useCallback } from 'react';
import { fetchKaryawan, createKaryawan, updateKaryawan, deleteKaryawan } from './api';
import { EMPTY_FORM, toFormData, formatDate, badgeClass, STATUS_OPTIONS } from './constants';
import KaryawanForm from './components/KaryawanForm';

export default function App() {
  const [karyawanList, setKaryawanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchKaryawan({ search, status: statusFilter });
      setKaryawanList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm(toFormData(item));
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setError('');
  }

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await updateKaryawan(editingId, form);
      } else {
        await createKaryawan(form);
      }
      closeModal();
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, nama) {
    if (!confirm(`Hapus data karyawan "${nama}"?`)) return;
    try {
      await deleteKaryawan(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <header className="app-header">
        <h1>Manajemen Karyawan</h1>
        <p>Kelola data karyawan perusahaan Anda</p>
      </header>

      <main className="container">
        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Cari nama, nomor karyawan, atau NIK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openCreate}>+ Tambah Karyawan</button>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading">Memuat data...</div>
          ) : karyawanList.length === 0 ? (
            <div className="empty-state">
              <p>Belum ada data karyawan.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}>
                Tambah Karyawan Pertama
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No. Karyawan</th>
                    <th>NIK</th>
                    <th>Nama Lengkap</th>
                    <th>Jenis Kelamin</th>
                    <th>Tgl Masuk</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {karyawanList.map((k) => (
                    <tr key={k.id}>
                      <td><strong>{k.employee_no}</strong></td>
                      <td>{k.nik}</td>
                      <td>
                        {k.nama_lengkap}
                        {k.nama_panggilan && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {' '}({k.nama_panggilan})
                          </span>
                        )}
                      </td>
                      <td>{k.jenis_kelamin === 'L' ? 'Laki-laki' : k.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</td>
                      <td>{formatDate(k.tanggal_masuk)}</td>
                      <td><span className={`badge ${badgeClass(k.status_karyawan)}`}>{k.status_karyawan}</span></td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(k)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(k.id, k.nama_lengkap)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <KaryawanForm
                form={form}
                onChange={setForm}
                onSubmit={handleSubmit}
                onCancel={closeModal}
                error={error}
                saving={saving}
                isEdit={!!editingId}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
