import { useState, useEffect } from 'react';
import {
  fetchAlamat, createAlamat, updateAlamat, deleteAlamat,
  fetchKontak, createKontak, updateKontak, deleteKontak,
  fetchKeluarga, createKeluarga, updateKeluarga, deleteKeluarga,
  fetchPendidikan, createPendidikan, updatePendidikan, deletePendidikan,
  fetchPosisi, createPosisi, updatePosisi, deletePosisi,
  fetchKontrak, createKontrak, updateKontrak, deleteKontrak,
  fetchKaryawanChanges,
} from '../api';
import { EMPTY_ALAMAT_FORM, toAlamatFormData, formatAlamatSingkat } from '../alamatConstants';
import { EMPTY_KONTAK_FORM, toKontakFormData } from '../kontakConstants';
import { EMPTY_KELUARGA_FORM, toKeluargaFormData } from '../keluargaConstants';
import { EMPTY_PENDIDIKAN_FORM, toPendidikanFormData } from '../pendidikanConstants';
import { formatDate, formatDateTime, formatMaybeDate } from '../constants';
import EntityManager from './EntityManager';
import AlamatForm from './AlamatForm';
import KontakForm from './KontakForm';
import KeluargaForm from './KeluargaForm';
import PendidikanForm from './PendidikanForm';
import PosisiForm, { KontrakForm } from './PosisiKontrakForms';
import { EMPTY_POSISI_FORM, toPosisiFormData } from '../posisiConstants';
import { EMPTY_KONTRAK_FORM, toKontrakFormData } from '../kontrakConstants';

const TABS = [
  { id: 'alamat', label: 'Alamat' },
  { id: 'kontak', label: 'Kontak' },
  { id: 'keluarga', label: 'Keluarga' },
  { id: 'pendidikan', label: 'Pendidikan' },
  { id: 'posisi', label: 'Posisi' },
  { id: 'kontrak', label: 'Kontrak' },
  { id: 'riwayat', label: 'Riwayat' },
];

export default function KaryawanDetailModal({ karyawan, onClose }) {
  const [activeTab, setActiveTab] = useState('alamat');
  const [changes, setChanges] = useState([]);

  useEffect(() => {
    if (activeTab === 'riwayat') {
      fetchKaryawanChanges(karyawan.id).then(setChanges).catch(() => setChanges([]));
    }
  }, [activeTab, karyawan.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Detail Karyawan</h2>
            <p className="modal-subtitle">{karyawan.nama_lengkap} ({karyawan.employee_no})</p>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {activeTab === 'alamat' && (
            <EntityManager
              employeeId={karyawan.id}
              entityLabel="Alamat"
              addLabel="Tambah Alamat"
              emptyForm={EMPTY_ALAMAT_FORM}
              toFormData={toAlamatFormData}
              fetchFn={fetchAlamat}
              createFn={createAlamat}
              updateFn={updateAlamat}
              deleteFn={deleteAlamat}
              FormComponent={AlamatForm}
              renderCard={(a) => (
                <>
                  <div className="entity-card-header">
                    <span className={`badge badge-type-${a.type.toLowerCase()}`}>{a.type}</span>
                    {a.is_primary && <span className="badge badge-primary-tag">Utama</span>}
                  </div>
                  <p className="entity-text">{formatAlamatSingkat(a)}</p>
                  <div className="entity-detail">
                    {a.rt && <span>RT {a.rt}</span>}
                    {a.rw && <span>RW {a.rw}</span>}
                    {a.kode_pos && <span>Kode Pos {a.kode_pos}</span>}
                  </div>
                </>
              )}
            />
          )}

          {activeTab === 'kontak' && (
            <EntityManager
              employeeId={karyawan.id}
              entityLabel="Kontak"
              addLabel="Tambah Kontak"
              emptyForm={EMPTY_KONTAK_FORM}
              toFormData={toKontakFormData}
              fetchFn={fetchKontak}
              createFn={createKontak}
              updateFn={updateKontak}
              deleteFn={deleteKontak}
              FormComponent={KontakForm}
              renderCard={(k) => (
                <>
                  <div className="entity-card-header">
                    <span className={`badge badge-type-${k.type.toLowerCase()}`}>{k.type}</span>
                    {k.is_primary && <span className="badge badge-primary-tag">Utama</span>}
                  </div>
                  <p className="entity-text"><strong>{k.nama}</strong></p>
                  <div className="entity-detail">
                    {k.hubungan && <span>{k.hubungan}</span>}
                    {k.nomor_telepon && <span>{k.nomor_telepon}</span>}
                  </div>
                </>
              )}
            />
          )}

          {activeTab === 'keluarga' && (
            <EntityManager
              employeeId={karyawan.id}
              entityLabel="Keluarga"
              addLabel="Tambah Keluarga"
              emptyForm={EMPTY_KELUARGA_FORM}
              toFormData={toKeluargaFormData}
              fetchFn={fetchKeluarga}
              createFn={createKeluarga}
              updateFn={updateKeluarga}
              deleteFn={deleteKeluarga}
              FormComponent={KeluargaForm}
              renderCard={(k) => (
                <>
                  <p className="entity-text"><strong>{k.nama}</strong></p>
                  <div className="entity-detail">
                    {k.hubungan && <span>{k.hubungan}</span>}
                    {k.jenis_kelamin && <span>{k.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>}
                    {k.tanggal_lahir && <span>{formatDate(k.tanggal_lahir)}</span>}
                    {k.pekerjaan && <span>{k.pekerjaan}</span>}
                  </div>
                </>
              )}
            />
          )}

          {activeTab === 'pendidikan' && (
            <EntityManager
              employeeId={karyawan.id}
              entityLabel="Pendidikan"
              addLabel="Tambah Pendidikan"
              emptyForm={EMPTY_PENDIDIKAN_FORM}
              toFormData={toPendidikanFormData}
              fetchFn={fetchPendidikan}
              createFn={createPendidikan}
              updateFn={updatePendidikan}
              deleteFn={deletePendidikan}
              FormComponent={PendidikanForm}
              renderCard={(p) => (
                <>
                  <div className="entity-card-header">
                    <span className="badge badge-type-ktp">{p.tingkat}</span>
                  </div>
                  <p className="entity-text"><strong>{p.nama_sekolah}</strong></p>
                  <div className="entity-detail">
                    {p.jurusan && <span>{p.jurusan}</span>}
                    {p.tahun_lulus && <span>Lulus {p.tahun_lulus}</span>}
                  </div>
                </>
              )}
            />
          )}

          {activeTab === 'posisi' && (
            <EntityManager
              employeeId={karyawan.id}
              entityLabel="Posisi"
              addLabel="Tambah Posisi"
              emptyForm={EMPTY_POSISI_FORM}
              toFormData={toPosisiFormData}
              fetchFn={fetchPosisi}
              createFn={createPosisi}
              updateFn={updatePosisi}
              deleteFn={deletePosisi}
              FormComponent={PosisiForm}
              renderCard={(p) => (
                <>
                  <div className="entity-card-header">
                    {p.is_current && <span className="badge badge-primary-tag">Aktif</span>}
                  </div>
                  <div className="entity-detail">
                    {p.start_date && <span>Mulai {formatDate(p.start_date)}</span>}
                    {p.end_date && <span> s/d {formatDate(p.end_date)}</span>}
                  </div>
                  {p.reason && <p className="entity-text">{p.reason}</p>}
                </>
              )}
            />
          )}

          {activeTab === 'kontrak' && (
            <EntityManager
              employeeId={karyawan.id}
              entityLabel="Kontrak"
              addLabel="Tambah Kontrak"
              emptyForm={EMPTY_KONTRAK_FORM}
              toFormData={toKontrakFormData}
              fetchFn={fetchKontrak}
              createFn={createKontrak}
              updateFn={updateKontrak}
              deleteFn={deleteKontrak}
              FormComponent={KontrakForm}
              renderCard={(k) => (
                <>
                  <div className="entity-card-header">
                    <span className="badge badge-type-ktp">{k.type}</span>
                    <span className="badge badge-type-domisili">{k.status}</span>
                  </div>
                  <p className="entity-text"><strong>{k.contract_no}</strong></p>
                  <div className="entity-detail">
                    {k.start_date && <span>{formatDate(k.start_date)}</span>}
                    {k.end_date && <span> - {formatDate(k.end_date)}</span>}
                  </div>
                </>
              )}
            />
          )}

          {activeTab === 'riwayat' && (
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
      </div>
    </div>
  );
}
