import { useState, useEffect, useCallback } from 'react';
import { fetchAlamat, createAlamat, updateAlamat, deleteAlamat } from '../api';
import { EMPTY_ALAMAT_FORM, toAlamatFormData, formatAlamatSingkat } from '../alamatConstants';
import AlamatForm from './AlamatForm';

export default function AlamatModal({ karyawan, onClose }) {
  const [alamatList, setAlamatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_ALAMAT_FORM });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAlamat = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAlamat(karyawan.id);
      setAlamatList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [karyawan.id]);

  useEffect(() => {
    loadAlamat();
  }, [loadAlamat]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_ALAMAT_FORM });
    setError('');
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm(toAlamatFormData(item));
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError('');
  }

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await updateAlamat(karyawan.id, editingId, form);
      } else {
        await createAlamat(karyawan.id, form);
      }
      closeForm();
      loadAlamat();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, type) {
    if (!confirm(`Hapus alamat ${type}?`)) return;
    try {
      await deleteAlamat(karyawan.id, id);
      loadAlamat();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Alamat Karyawan</h2>
            <p className="modal-subtitle">{karyawan.nama_lengkap} ({karyawan.employee_no})</p>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {!showForm ? (
            <>
              <div className="toolbar" style={{ marginBottom: '1rem' }}>
                <button className="btn btn-primary" onClick={openCreate}>+ Tambah Alamat</button>
              </div>

              {loading ? (
                <div className="loading">Memuat alamat...</div>
              ) : alamatList.length === 0 ? (
                <div className="empty-state">
                  <p>Belum ada alamat terdaftar.</p>
                  <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}>
                    Tambah Alamat Pertama
                  </button>
                </div>
              ) : (
                <div className="alamat-list">
                  {alamatList.map((a) => (
                    <div key={a.id} className={`alamat-card ${a.is_primary ? 'alamat-primary' : ''}`}>
                      <div className="alamat-card-header">
                        <span className={`badge badge-type-${a.type.toLowerCase()}`}>{a.type}</span>
                        {a.is_primary && <span className="badge badge-primary-tag">Utama</span>}
                      </div>
                      <p className="alamat-text">{formatAlamatSingkat(a)}</p>
                      <div className="alamat-detail">
                        {a.rt && <span>RT {a.rt}</span>}
                        {a.rw && <span>RW {a.rw}</span>}
                        {a.kode_pos && <span>Kode Pos {a.kode_pos}</span>}
                        {a.provinsi && <span>{a.provinsi}</span>}
                      </div>
                      <div className="actions" style={{ marginTop: '0.75rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(a)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id, a.type)}>Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }} onClick={closeForm}>
                &larr; Kembali ke Daftar
              </button>
              <AlamatForm
                form={form}
                onChange={setForm}
                onSubmit={handleSubmit}
                onCancel={closeForm}
                error={error}
                saving={saving}
                isEdit={!!editingId}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
