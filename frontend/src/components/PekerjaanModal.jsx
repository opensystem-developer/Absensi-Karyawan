import { useState, useEffect, useMemo } from 'react';
import {
  fetchPosisi, createPosisi, updatePosisi, deletePosisi,
  fetchKontrak, createKontrak, updateKontrak, deleteKontrak,
  fetchEmployeeShifts, createEmployeeShift, updateEmployeeShift, deleteEmployeeShift,
  fetchWorkSchedules, createWorkSchedule, updateWorkSchedule, deleteWorkSchedule,
  fetchAttendances, createAttendance, updateAttendance, deleteAttendance,
} from '../api';
import { formatDate, formatDateTime, displayEmployeeNo } from '../constants';
import { EMPTY_POSISI_FORM, toPosisiFormData } from '../posisiConstants';
import { EMPTY_KONTRAK_FORM, toKontrakFormData } from '../kontrakConstants';
import {
  EMPTY_EMPLOYEE_SHIFT_FORM, toEmployeeShiftFormData,
  EMPTY_WORK_SCHEDULE_FORM, toWorkScheduleFormData,
  EMPTY_ATTENDANCE_FORM, toAttendanceFormData,
  workScheduleStatusLabel, attendanceStatusLabel, formatTimeRange,
} from '../shiftConstants';
import { PekerjaanFormFields } from './PekerjaanForm';
import EntityManager from './EntityManager';
import PosisiForm, { KontrakForm } from './PosisiKontrakForms';
import { EmployeeShiftForm, WorkScheduleForm, AttendanceForm } from './ShiftForms';

const TABS = [
  { id: 'utama', label: 'Data Pekerjaan', always: true },
  { id: 'posisi', label: 'Posisi' },
  { id: 'kontrak', label: 'Kontrak' },
  { id: 'shift', label: 'Shift' },
  { id: 'jadwal', label: 'Jadwal' },
  { id: 'kehadiran', label: 'Kehadiran' },
];

export default function PekerjaanModal({
  employee,
  form,
  onChange,
  onSubmit,
  onCancel,
  error,
  saving,
  writable,
  setupReady,
}) {
  const [activeTab, setActiveTab] = useState('utama');
  const employeeId = employee?.id;
  const hasEmployeeNo = employee?.employee_no && !String(employee.employee_no).startsWith('DRAFT/');

  async function handleCreateEmployeeShift(empId, data) {
    const res = await createEmployeeShift(empId, data);
    const gen = res.schedules_generated;
    if (gen?.created > 0) {
      window.alert(`Jadwal kerja otomatis: ${gen.created} hari dibuat (${gen.from} s/d ${gen.to})${gen.skipped ? `, ${gen.skipped} hari sudah ada` : ''}.`);
    }
    return res;
  }

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

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit();
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-wide modal-tall" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Data Pekerjaan</h2>
            <p className="modal-subtitle">
              {employee?.nama_lengkap} — {displayEmployeeNo(employee?.employee_no)}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onCancel}>&times;</button>
        </div>

        <div className="tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-body modal-body-scroll">
          {activeTab === 'utama' && (
            <form onSubmit={handleSubmit}>
              {error && <div className="error-banner">{error}</div>}
              {!setupReady && (
                <div className="setup-banner" style={{ marginBottom: '1rem' }}>
                  <h3>Master data belum lengkap</h3>
                  <p>Lengkapi master data organisasi sebelum menetapkan pekerjaan karyawan.</p>
                </div>
              )}
              <PekerjaanFormFields
                form={form}
                onChange={onChange}
                hasEmployeeNo={hasEmployeeNo}
                readOnly={!writable}
              />
              {writable && (
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={onCancel}>Tutup</button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving || !setupReady || (!hasEmployeeNo && !form.branch_id)}
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Data Pekerjaan'}
                  </button>
                </div>
              )}
            </form>
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
              createFn={handleCreateEmployeeShift}
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
