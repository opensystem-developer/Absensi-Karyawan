import { useState, useEffect } from 'react';
import {
  fetchAlamat, createAlamat, updateAlamat, deleteAlamat,
  fetchKontak, createKontak, updateKontak, deleteKontak,
  fetchKeluarga, createKeluarga, updateKeluarga, deleteKeluarga,
  fetchPendidikan, createPendidikan, updatePendidikan, deletePendidikan,
  fetchKaryawanChanges,
} from '../api';
import { formatDate, formatDateTime, formatMaybeDate } from '../constants';
import { EMPTY_ALAMAT_FORM, toAlamatFormData, formatAlamatSingkat } from '../alamatConstants';
import { EMPTY_KONTAK_FORM, toKontakFormData } from '../kontakConstants';
import { EMPTY_KELUARGA_FORM, toKeluargaFormData } from '../keluargaConstants';
import { EMPTY_PENDIDIKAN_FORM, toPendidikanFormData } from '../pendidikanConstants';
import { KaryawanFormFields } from './KaryawanForm';
import EntityManager from './EntityManager';
import AlamatForm from './AlamatForm';
import KontakForm from './KontakForm';
import KeluargaForm from './KeluargaForm';
import PendidikanForm from './PendidikanForm';

const TABS = [
  { id: 'utama', label: 'Data Utama', always: true },
  { id: 'alamat', label: 'Alamat' },
  { id: 'kontak', label: 'Kontak' },
  { id: 'keluarga', label: 'Keluarga' },
  { id: 'pendidikan', label: 'Pendidikan' },
  { id: 'riwayat', label: 'Riwayat' },
];

export default function KaryawanModal({
  employeeId,
  form,
  onChange,
  onSubmit,
  onCancel,
  error,
  saving,
  writable,
  onSaved,
}) {
  const [activeTab, setActiveTab] = useState('utama');
  const [changes, setChanges] = useState([]);
  const isEdit = !!employeeId;

  useEffect(() => {
    setActiveTab('utama');
  }, [employeeId]);

  useEffect(() => {
    if (activeTab === 'riwayat' && employeeId) {
      fetchKaryawanChanges(employeeId).then(setChanges).catch(() => setChanges([]));
    }
  }, [activeTab, employeeId]);

  function handleTabClick(tabId) {
    if (tabId !== 'utama' && !employeeId) return;
    setActiveTab(tabId);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const saved = await onSubmit();
    if (saved && !isEdit) onSaved?.(saved);
  }

  const title = isEdit ? 'Data Karyawan' : 'Tambah Karyawan';
  const subtitle = isEdit ? form.nama_lengkap || '-' : null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-wide modal-tall" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="modal-close" onClick={onCancel}>&times;</button>
        </div>

        <div className="tab-bar">
          {TABS.map((tab) => {
            const disabled = !tab.always && !employeeId;
            return (
              <button
                key={tab.id}
                type="button"
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''} ${disabled ? 'tab-btn-disabled' : ''}`}
                onClick={() => handleTabClick(tab.id)}
                title={disabled ? 'Simpan data utama terlebih dahulu' : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="modal-body modal-body-scroll">
          {activeTab === 'utama' && (
            <form onSubmit={handleSubmit}>
              {error && <div className="error-banner">{error}</div>}
              {!employeeId && (
                <div className="info-banner">
                  Simpan data karyawan terlebih dahulu untuk mengisi alamat, kontak, dan data lainnya.
                  Data pekerjaan diatur terpisah di menu <strong>Pekerjaan Karyawan</strong>.
                </div>
              )}
              <KaryawanFormFields form={form} onChange={onChange} readOnly={!writable} />
              {writable ? (
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={onCancel}>Tutup</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan & Lanjut'}
                  </button>
                </div>
              ) : (
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={onCancel}>Tutup</button>
                </div>
              )}
            </form>
          )}

          {activeTab === 'alamat' && employeeId && (
            <EntityManager
              employeeId={employeeId}
              entityLabel="Alamat"
              addLabel="Tambah Alamat"
              emptyForm={EMPTY_ALAMAT_FORM}
              toFormData={toAlamatFormData}
              fetchFn={fetchAlamat}
              createFn={createAlamat}
              updateFn={updateAlamat}
              deleteFn={deleteAlamat}
              FormComponent={AlamatForm}
              writable={writable}
              renderCard={(a) => (
                <>
                  <div className="entity-card-header">
                    <span className={`badge badge-type-${a.type.toLowerCase()}`}>{a.type}</span>
                    {a.is_primary && <span className="badge badge-primary-tag">Utama</span>}
                  </div>
                  <p className="entity-text">{formatAlamatSingkat(a)}</p>
                </>
              )}
            />
          )}

          {activeTab === 'kontak' && employeeId && (
            <EntityManager
              employeeId={employeeId}
              entityLabel="Kontak"
              addLabel="Tambah Kontak"
              emptyForm={EMPTY_KONTAK_FORM}
              toFormData={toKontakFormData}
              fetchFn={fetchKontak}
              createFn={createKontak}
              updateFn={updateKontak}
              deleteFn={deleteKontak}
              FormComponent={KontakForm}
              writable={writable}
              renderCard={(k) => (
                <>
                  <p className="entity-text"><strong>{k.nama}</strong></p>
                  <div className="entity-detail">
                    {k.hubungan && <span>{k.hubungan}</span>}
                    {k.nomor_telepon && <span>{k.nomor_telepon}</span>}
                  </div>
                </>
              )}
            />
          )}

          {activeTab === 'keluarga' && employeeId && (
            <EntityManager
              employeeId={employeeId}
              entityLabel="Keluarga"
              addLabel="Tambah Keluarga"
              emptyForm={EMPTY_KELUARGA_FORM}
              toFormData={toKeluargaFormData}
              fetchFn={fetchKeluarga}
              createFn={createKeluarga}
              updateFn={updateKeluarga}
              deleteFn={deleteKeluarga}
              FormComponent={KeluargaForm}
              writable={writable}
              renderCard={(k) => (
                <>
                  <p className="entity-text"><strong>{k.nama}</strong></p>
                  <div className="entity-detail">
                    {k.hubungan && <span>{k.hubungan}</span>}
                    {k.tanggal_lahir && <span>{formatDate(k.tanggal_lahir)}</span>}
                  </div>
                </>
              )}
            />
          )}

          {activeTab === 'pendidikan' && employeeId && (
            <EntityManager
              employeeId={employeeId}
              entityLabel="Pendidikan"
              addLabel="Tambah Pendidikan"
              emptyForm={EMPTY_PENDIDIKAN_FORM}
              toFormData={toPendidikanFormData}
              fetchFn={fetchPendidikan}
              createFn={createPendidikan}
              updateFn={updatePendidikan}
              deleteFn={deletePendidikan}
              FormComponent={PendidikanForm}
              writable={writable}
              renderCard={(p) => (
                <>
                  <p className="entity-text"><strong>{p.nama_sekolah}</strong> ({p.tingkat})</p>
                </>
              )}
            />
          )}

          {activeTab === 'riwayat' && employeeId && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Waktu</th><th>Aksi</th><th>Field</th><th>Lama</th><th>Baru</th><th>Oleh</th></tr></thead>
                <tbody>
                  {changes.length === 0 ? (
                    <tr><td colSpan={6} className="empty-state">Belum ada riwayat perubahan</td></tr>
                  ) : changes.map((c) => (
                    <tr key={c.id}>
                      <td>{formatDateTime(c.changed_at)}</td>
                      <td>{c.action}</td>
                      <td>{c.field_name || '-'}</td>
                      <td className="cell-truncate">{formatMaybeDate(c.old_value)}</td>
                      <td className="cell-truncate">{formatMaybeDate(c.new_value)}</td>
                      <td>{c.changed_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {activeTab !== 'utama' && (
          <div className="modal-footer modal-footer-sticky">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Tutup</button>
          </div>
        )}
      </div>
    </div>
  );
}
