import { useState, useEffect } from 'react';
import { displayColorsApi } from '../api';
import { useDisplayColors } from '../context/DisplayColorContext';

const SCHEDULE_KEYS = [
  { status: 'OFF', label: 'Libur', cellCode: 'OFF' },
  { status: 'LEAVE', label: 'Cuti', cellCode: 'CT' },
  { status: 'HOLIDAY', label: 'Libur Nasional', cellCode: 'LN' },
];

const ATTENDANCE_KEYS = [
  { status: 'PRESENT', label: 'Hadir', cellCode: 'H' },
  { status: 'LATE', label: 'Terlambat', cellCode: 'T' },
  { status: 'ABSENT', label: 'Tidak Hadir', cellCode: 'A' },
  { status: 'LEAVE', label: 'Cuti', cellCode: 'CT' },
  { status: 'OFF', label: 'Libur', cellCode: 'OFF' },
];

function ColorField({ label, value, onChange }) {
  const v = value || '#ffffff';
  return (
    <div className="color-field">
      <label>{label}</label>
      <div className="color-field-inputs">
        <input type="color" value={v} onChange={(e) => onChange(e.target.value)} />
        <input type="text" value={v} onChange={(e) => onChange(e.target.value)} maxLength={7} />
      </div>
    </div>
  );
}

function ColorRow({ title, code, colors, onChange }) {
  const swatchStyle = colors?.bg && colors?.fg ? {
    backgroundColor: colors.bg,
    color: colors.fg,
    borderColor: colors.border || colors.bg,
  } : {};

  return (
    <div className="color-settings-row">
      <div className="color-settings-row-head">
        <span className="schedule-legend-code" style={swatchStyle}>{code}</span>
        <strong>{title}</strong>
      </div>
      <div className="color-settings-fields">
        <ColorField label="Latar" value={colors.bg} onChange={(v) => onChange({ ...colors, bg: v })} />
        <ColorField label="Teks" value={colors.fg} onChange={(v) => onChange({ ...colors, fg: v })} />
        <ColorField label="Border" value={colors.border} onChange={(v) => onChange({ ...colors, border: v })} />
      </div>
    </div>
  );
}

export default function DisplayColorSettingsModal({ open, onClose, writable = true }) {
  const { config, refresh } = useDisplayColors();
  const [scheduleStatus, setScheduleStatus] = useState({});
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [shifts, setShifts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !config) return;
    setScheduleStatus({ ...config.scheduleStatus });
    setAttendanceStatus({ ...config.attendanceStatus });
    setShifts(config.shifts?.map((s) => ({ ...s })) || []);
    setError('');
  }, [open, config]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        scheduleStatus: Object.fromEntries(
          SCHEDULE_KEYS.map(({ status }) => [status, {
            bg: scheduleStatus[status]?.bg,
            fg: scheduleStatus[status]?.fg,
            border: scheduleStatus[status]?.border,
          }]),
        ),
        attendanceStatus: Object.fromEntries(
          ATTENDANCE_KEYS.map(({ status }) => [status, {
            bg: attendanceStatus[status]?.bg,
            fg: attendanceStatus[status]?.fg,
            border: attendanceStatus[status]?.border,
          }]),
        ),
        shifts: shifts.map((s) => ({
          id: s.id,
          color_bg: s.color_bg,
          color_fg: s.color_fg,
          color_border: s.color_border,
        })),
      };
      await displayColorsApi.update(payload);
      await refresh();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide modal-tall" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pengaturan Warna Tampilan</h2>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body modal-body-scroll">
          {error && <div className="error-banner">{error}</div>}
          <p className="text-muted" style={{ marginBottom: '1rem' }}>
            Atur warna sel untuk jadwal kerja, kehadiran, dan setiap shift.
          </p>

          <section className="color-settings-section">
            <h3>Status Jadwal Kerja</h3>
            {SCHEDULE_KEYS.map((row) => (
              <ColorRow
                key={row.status}
                title={row.label}
                code={row.cellCode}
                colors={scheduleStatus[row.status] || {}}
                onChange={(c) => setScheduleStatus((prev) => ({ ...prev, [row.status]: c }))}
              />
            ))}
          </section>

          <section className="color-settings-section">
            <h3>Status Kehadiran</h3>
            {ATTENDANCE_KEYS.map((row) => (
              <ColorRow
                key={row.status}
                title={row.label}
                code={row.cellCode}
                colors={attendanceStatus[row.status] || {}}
                onChange={(c) => setAttendanceStatus((prev) => ({ ...prev, [row.status]: c }))}
              />
            ))}
          </section>

          <section className="color-settings-section">
            <h3>Warna per Shift</h3>
            {shifts.length === 0 ? (
              <p className="text-muted">Belum ada data shift.</p>
            ) : (
              shifts.map((shift, idx) => (
                <ColorRow
                  key={shift.id}
                  title={`${shift.name} (${shift.code})`}
                  code={shift.code}
                  colors={{
                    bg: shift.color_bg,
                    fg: shift.color_fg,
                    border: shift.color_border,
                  }}
                  onChange={(c) => {
                    setShifts((prev) => prev.map((s, i) => i === idx ? {
                      ...s,
                      color_bg: c.bg,
                      color_fg: c.fg,
                      color_border: c.border,
                    } : s));
                  }}
                />
              ))
            )}
          </section>
        </div>
        <div className="modal-footer modal-footer-sticky">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Tutup</button>
          {writable && (
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Warna'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
