import { useState, useEffect, useMemo } from 'react';
import {
  fetchAlamat, createAlamat, updateAlamat, deleteAlamat,
  fetchKontak, createKontak, updateKontak, deleteKontak,
  fetchKeluarga, createKeluarga, updateKeluarga, deleteKeluarga,
  fetchPendidikan, createPendidikan, updatePendidikan, deletePendidikan,
  fetchPosisi, createPosisi, updatePosisi, deletePosisi,
  fetchKontrak, createKontrak, updateKontrak, deleteKontrak,
  fetchEmployeeShifts, createEmployeeShift, updateEmployeeShift, deleteEmployeeShift,
  fetchWorkSchedules, createWorkSchedule, updateWorkSchedule, deleteWorkSchedule,
  fetchAttendances, createAttendance, updateAttendance, deleteAttendance,
  fetchKaryawanChanges,
} from '../api';
import { formatDate, formatDateTime, formatMaybeDate } from '../constants';
import { EMPTY_ALAMAT_FORM, toAlamatFormData, formatAlamatSingkat } from '../alamatConstants';
import { EMPTY_KONTAK_FORM, toKontakFormData } from '../kontakConstants';
import { EMPTY_KELUARGA_FORM, toKeluargaFormData } from '../keluargaConstants';
import { EMPTY_PENDIDIKAN_FORM, toPendidikanFormData } from '../pendidikanConstants';
import { EMPTY_POSISI_FORM, toPosisiFormData } from '../posisiConstants';
import { EMPTY_KONTRAK_FORM, toKontrakFormData } from '../kontrakConstants';
import {
  EMPTY_EMPLOYEE_SHIFT_FORM, toEmployeeShiftFormData,
  EMPTY_WORK_SCHEDULE_FORM, toWorkScheduleFormData,
  EMPTY_ATTENDANCE_FORM, toAttendanceFormData,
  workScheduleStatusLabel, attendanceStatusLabel, formatTimeRange,
} from '../shiftConstants';
import { KaryawanFormFields } from './KaryawanForm';
import EntityManager from './EntityManager';
import AlamatForm from './AlamatForm';
import KontakForm from './KontakForm';
import KeluargaForm from './KeluargaForm';
import PendidikanForm from './PendidikanForm';
import PosisiForm, { KontrakForm } from './PosisiKontrakForms';
import { EmployeeShiftForm, WorkScheduleForm, AttendanceForm } from './ShiftForms';

const TABS = [
  { id: 'utama', label: 'Data Utama', always: true },
  { id: 'alamat', label: 'Alamat' },
  { id: 'kontak', label: 'Kontak' },
  { id: 'keluarga', label: 'Keluarga' },
  { id: 'pendidikan', label: 'Pendidikan' },
  { id: 'posisi', label: 'Posisi' },
  { id: 'kontrak', label: 'Kontrak' },
  { id: 'shift', label: 'Shift' },
  { id: 'jadwal', label: 'Jadwal' },
  { id: 'kehadiran', label: 'Kehadiran' },
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

  const AttendanceFormBound = useMemo(() => function BoundAttendanceForm(props) {
    const [schedules, setSchedules] = useState([]);
    useEffect(() => {
      if (employeeId) fetchWorkSchedules(employeeId).then(setSchedules).catch(() => setSchedules([]));
    }, []);
    return <AttendanceForm {...props} schedules={schedules} />;
  }, [employeeId]);

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
    if (saved && !isEdit) {
      onSaved?.(saved);
    }
  }

  const title = isEdit ? 'Data Karyawan' : 'Tambah Karyawan';
  const subtitle = isEdit ? `${form.nama_lengkap || '-'} (${form.employee_no || '-'})` : null;

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
                  Simpan data utama terlebih dahulu untuk mengisi alamat, kontak, dan data lainnya.
                </div>
              )}
              <KaryawanFormFields form={form} onChange={onChange} isEdit={isEdit} readOnly={!writable} />
              {writable ? (
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={onCancel}>Tutup</button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving || (!isEdit && !form.branch_id)}
                  >
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
                  <div className="entity-detail">
                    {a.rt && <span>RT {a.rt}</span>}
                    {a.rw && <span>RW {a.rw}</span>}
                    {a.kode_pos && <span>Kode Pos {a.kode_pos}</span>}
                  </div>
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
                    {k.jenis_kelamin && <span>{k.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>}
                    {k.tanggal_lahir && <span>{formatDate(k.tanggal_lahir)}</span>}
                    {k.pekerjaan && <span>{k.pekerjaan}</span>}
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

          {activeTab === 'posisi' && employeeId && (
            <EntityManager
              employeeId={employeeId}
              entityLabel="Posisi"
              addLabel="Tambah Posisi"
              emptyForm={EMPTY_POSISI_FORM}
              toFormData={toPosisiFormData}
              fetchFn={fetchPosisi}
              createFn={createPosisi}
              updateFn={updatePosisi}
              deleteFn={deletePosisi}
              FormComponent={PosisiForm}
              writable={writable}
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

          {activeTab === 'kontrak' && employeeId && (
            <EntityManager
              employeeId={employeeId}
              entityLabel="Kontrak"
              addLabel="Tambah Kontrak"
              emptyForm={EMPTY_KONTRAK_FORM}
              toFormData={toKontrakFormData}
              fetchFn={fetchKontrak}
              createFn={createKontrak}
              updateFn={updateKontrak}
              deleteFn={deleteKontrak}
              FormComponent={KontrakForm}
              writable={writable}
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

          {activeTab === 'shift' && employeeId && (
            <EntityManager
              employeeId={employeeId}
              entityLabel="Shift karyawan"
              addLabel="Tambah Shift"
              emptyForm={EMPTY_EMPLOYEE_SHIFT_FORM}
              toFormData={toEmployeeShiftFormData}
              fetchFn={fetchEmployeeShifts}
              createFn={createEmployeeShift}
              updateFn={updateEmployeeShift}
              deleteFn={deleteEmployeeShift}
              FormComponent={EmployeeShiftForm}
              writable={writable}
              renderCard={(s) => (
                <>
                  <p className="entity-text"><strong>{s.shift_name}</strong> ({s.shift_code})</p>
                  <div className="entity-detail">
                    <span>{formatTimeRange(s.shift_start, s.shift_end)}</span>
                    {s.effective_from && <span>Mulai {formatDate(s.effective_from)}</span>}
                    {s.effective_to && <span>s/d {formatDate(s.effective_to)}</span>}
                  </div>
                </>
              )}
            />
          )}

          {activeTab === 'jadwal' && employeeId && (
            <EntityManager
              employeeId={employeeId}
              entityLabel="Jadwal kerja"
              addLabel="Tambah Jadwal"
              emptyForm={EMPTY_WORK_SCHEDULE_FORM}
              toFormData={toWorkScheduleFormData}
              fetchFn={fetchWorkSchedules}
              createFn={createWorkSchedule}
              updateFn={updateWorkSchedule}
              deleteFn={deleteWorkSchedule}
              FormComponent={WorkScheduleForm}
              writable={writable}
              renderCard={(j) => (
                <>
                  <div className="entity-card-header">
                    <span className="badge badge-type-ktp">{workScheduleStatusLabel(j.status)}</span>
                  </div>
                  <p className="entity-text"><strong>{formatDate(j.work_date)}</strong> — {j.shift_name}</p>
                  <div className="entity-detail">
                    <span>{formatTimeRange(j.start_time || j.shift_start, j.end_time || j.shift_end)}</span>
                  </div>
                </>
              )}
            />
          )}

          {activeTab === 'kehadiran' && employeeId && (
            <EntityManager
              employeeId={employeeId}
              entityLabel="Kehadiran"
              addLabel="Tambah Kehadiran"
              emptyForm={EMPTY_ATTENDANCE_FORM}
              toFormData={toAttendanceFormData}
              fetchFn={fetchAttendances}
              createFn={(empId, data) => createAttendance(empId, {
                ...data,
                clock_in: data.clock_in ? data.clock_in.replace('T', ' ') : null,
                clock_out: data.clock_out ? data.clock_out.replace('T', ' ') : null,
                schedule_id: data.schedule_id || null,
              })}
              updateFn={(empId, id, data) => updateAttendance(empId, id, {
                ...data,
                clock_in: data.clock_in ? data.clock_in.replace('T', ' ') : null,
                clock_out: data.clock_out ? data.clock_out.replace('T', ' ') : null,
                schedule_id: data.schedule_id || null,
              })}
              deleteFn={deleteAttendance}
              FormComponent={AttendanceFormBound}
              writable={writable}
              renderCard={(a) => (
                <>
                  <div className="entity-card-header">
                    <span className="badge badge-type-ktp">{attendanceStatusLabel(a.status)}</span>
                    {a.anomaly_flag && <span className="badge badge-type-emergency">Anomali</span>}
                  </div>
                  <p className="entity-text"><strong>{formatDate(a.work_date)}</strong></p>
                  <div className="entity-detail">
                    <span>In: {formatDateTime(a.clock_in)}</span>
                    <span>Out: {formatDateTime(a.clock_out)}</span>
                    {a.late_minutes > 0 && <span>Telat {a.late_minutes} mnt</span>}
                    {a.overtime_minutes > 0 && <span>Lembur {a.overtime_minutes} mnt</span>}
                  </div>
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
