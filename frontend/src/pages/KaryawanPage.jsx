import { useState, useEffect, useCallback } from 'react';
import { fetchKaryawan, createKaryawan, updateKaryawan, deleteKaryawan } from '../api';
import { EMPTY_KARYAWAN_FORM, toKaryawanFormData, formatDate, displayEmployeeNo } from '../constants';
import { useAuth } from '../context/AuthContext';
import KaryawanModal from '../components/KaryawanModal';

export default function KaryawanPage() {
  const [karyawanList, setKaryawanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_KARYAWAN_FORM });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { canWrite } = useAuth();
  const writable = canWrite('karyawan');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchKaryawan({ search });
      setKaryawanList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  function openModal(item = null) {
    setEditingId(item?.id ?? null);
    setForm(item ? toKaryawanFormData(item) : { ...EMPTY_KARYAWAN_FORM });
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
      let saved;
      if (editingId) {
        saved = await updateKaryawan(editingId, form);
      } else {
        saved = await createKaryawan(form);
        setEditingId(saved.id);
        setForm(toKaryawanFormData(saved));
      }
      loadData();
      return saved;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  function handleSaved(saved) {
    setEditingId(saved.id);
    setForm(toKaryawanFormData(saved));
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
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Karyawan</h1>
          <p>Kelola data pribadi karyawan (identitas, alamat, kontak, keluarga, pendidikan)</p>
        </div>
        {writable && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            + Tambah Karyawan
          </button>
        )}
      </div>

      <div className="info-banner" style={{ marginBottom: '1rem' }}>
        Data pekerjaan (cabang, nomor karyawan, posisi, shift, jadwal, kehadiran) dikelola terpisah di menu <strong>Pekerjaan Karyawan</strong>.
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Cari nama atau NIK..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Memuat data...</div>
        ) : karyawanList.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada data karyawan.</p>
            {writable && (
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => openModal()}>
                Tambah Karyawan Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>NIK</th><th>Nama</th><th>JK</th><th>No. Karyawan</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {karyawanList.map((k) => (
                  <tr key={k.id}>
                    <td>{k.nik}</td>
                    <td>
                      {k.nama_lengkap}
                      {k.nama_panggilan && <span className="text-muted"> ({k.nama_panggilan})</span>}
                    </td>
                    <td>{k.jenis_kelamin === 'L' ? 'Laki-laki' : k.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</td>
                    <td>{displayEmployeeNo(k.employee_no)}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal(k)}>Data Karyawan</button>
                        {writable && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(k.id, k.nama_lengkap)}>Hapus</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <KaryawanModal
          employeeId={editingId}
          form={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          onSaved={handleSaved}
          error={error}
          saving={saving}
          writable={writable}
        />
      )}
    </div>
  );
}
