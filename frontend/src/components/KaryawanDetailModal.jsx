import { useState } from 'react';
import {
  fetchAlamat, createAlamat, updateAlamat, deleteAlamat,
  fetchKontak, createKontak, updateKontak, deleteKontak,
  fetchKeluarga, createKeluarga, updateKeluarga, deleteKeluarga,
  fetchPendidikan, createPendidikan, updatePendidikan, deletePendidikan,
} from '../api';
import { EMPTY_ALAMAT_FORM, toAlamatFormData, formatAlamatSingkat } from '../alamatConstants';
import { EMPTY_KONTAK_FORM, toKontakFormData } from '../kontakConstants';
import { EMPTY_KELUARGA_FORM, toKeluargaFormData } from '../keluargaConstants';
import { EMPTY_PENDIDIKAN_FORM, toPendidikanFormData } from '../pendidikanConstants';
import { formatDate } from '../constants';
import EntityManager from './EntityManager';
import AlamatForm from './AlamatForm';
import KontakForm from './KontakForm';
import KeluargaForm from './KeluargaForm';
import PendidikanForm from './PendidikanForm';

const TABS = [
  { id: 'alamat', label: 'Alamat' },
  { id: 'kontak', label: 'Kontak' },
  { id: 'keluarga', label: 'Keluarga' },
  { id: 'pendidikan', label: 'Pendidikan' },
];

export default function KaryawanDetailModal({ karyawan, onClose }) {
  const [activeTab, setActiveTab] = useState('alamat');

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
        </div>
      </div>
    </div>
  );
}
