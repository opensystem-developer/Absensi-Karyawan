import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchKaryawan, updatePekerjaan, fetchKaryawanSetupStatus } from '../api';
import { toPekerjaanFormData, formatDate, badgeClass, displayEmployeeNo } from '../constants';
import { useAuth } from '../context/AuthContext';
import PekerjaanModal from '../components/PekerjaanModal';

const FLOW_STEPS = ['Perusahaan', 'Cabang', 'Departemen', 'Jabatan', 'Status Karyawan'];

export default function PekerjaanKaryawanPage() {
  const [karyawanList, setKaryawanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [setupStatus, setSetupStatus] = useState({ ready: true, missing: [] });
  const { canWrite } = useAuth();
  const writable = canWrite('karyawan');

  const loadSetup = useCallback(async () => {
    try {
      setSetupStatus(await fetchKaryawanSetupStatus());
    } catch {
      setSetupStatus({ ready: false, missing: FLOW_STEPS.map((label) => ({ label })) });
    }
  }, []);

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

  useEffect(() => { loadSetup(); }, [loadSetup]);
  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  function openPekerjaan(item) {
    setSelected(item);
    setForm(toPekerjaanFormData(item));
    setError('');
  }

  function closeModal() {
    setSelected(null);
    setError('');
  }

  async function handleSubmit() {
    if (!selected) return null;
    setSaving(true);
    setError('');
    try {
      const saved = await updatePekerjaan(selected.id, form);
      setSelected(saved);
      setForm(toPekerjaanFormData(saved));
      loadData();
      return saved;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Pekerjaan Karyawan</h1>
          <p>Kelola penempatan, posisi, kontrak, shift, jadwal, dan kehadiran</p>
        </div>
      </div>

      {!setupStatus.ready && (
        <div className="setup-banner">
          <h3>Master data belum lengkap</h3>
          <p>Lengkapi data berikut sebelum menetapkan pekerjaan karyawan:</p>
          <ol className="setup-flow">
            {FLOW_STEPS.map((step) => {
              const missing = setupStatus.missing?.find((m) => m.label === step);
              const paths = {
                Perusahaan: '/perusahaan', Cabang: '/cabang', Departemen: '/departemen',
                Jabatan: '/jabatan', 'Status Karyawan': '/status-karyawan',
              };
              return (
                <li key={step} className={missing ? 'setup-missing' : 'setup-done'}>
                  {missing ? (
                    <Link to={paths[step]}>{step} — belum ada data</Link>
                  ) : (
                    <span>{step} — selesai</span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Cari nama, nomor karyawan, atau NIK..."
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
            <Link to="/karyawan" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
              Tambah Karyawan Dulu
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No. Karyawan</th><th>Nama</th><th>Tgl Masuk</th><th>Status</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {karyawanList.map((k) => (
                  <tr key={k.id}>
                    <td><strong>{displayEmployeeNo(k.employee_no)}</strong></td>
                    <td>{k.nama_lengkap}</td>
                    <td>{formatDate(k.tanggal_masuk)}</td>
                    <td><span className={`badge ${badgeClass(k.status_karyawan)}`}>{k.status_karyawan}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openPekerjaan(k)}>
                        Kelola Pekerjaan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <PekerjaanModal
          employee={selected}
          form={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          error={error}
          saving={saving}
          writable={writable}
          setupReady={setupStatus.ready}
        />
      )}
    </div>
  );
}
