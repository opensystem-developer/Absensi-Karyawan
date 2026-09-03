import { NOT_DELETED } from './audit.js';
import {
  deriveCellColors,
  enrichShiftColorFields,
  ensureShiftDefaultColors,
} from './colorUtils.js';

export const SCHEDULE_STATUS_DEFS = [
  { key: 'schedule_OFF', status: 'OFF', label: 'Libur', cellCode: 'OFF', group: 'schedule' },
  { key: 'schedule_LEAVE', status: 'LEAVE', label: 'Cuti', cellCode: 'CT', group: 'schedule' },
  { key: 'schedule_HOLIDAY', status: 'HOLIDAY', label: 'Libur Nasional', cellCode: 'LN', group: 'schedule' },
];

export const ATTENDANCE_STATUS_DEFS = [
  { key: 'attendance_PRESENT', status: 'PRESENT', label: 'Hadir', cellCode: 'H', group: 'attendance' },
  { key: 'attendance_LATE', status: 'LATE', label: 'Terlambat', cellCode: 'T', group: 'attendance' },
  { key: 'attendance_ABSENT', status: 'ABSENT', label: 'Tidak Hadir', cellCode: 'A', group: 'attendance' },
  { key: 'attendance_LEAVE', status: 'LEAVE', label: 'Cuti', cellCode: 'CT', group: 'attendance' },
  { key: 'attendance_OFF', status: 'OFF', label: 'Libur', cellCode: 'OFF', group: 'attendance' },
];

export const DEFAULT_COLORS = {
  schedule_OFF: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
  schedule_LEAVE: { bg: '#fef3c7', fg: '#b45309', border: '#fcd34d' },
  schedule_HOLIDAY: { bg: '#ede9fe', fg: '#6d28d9', border: '#c4b5fd' },
  attendance_PRESENT: { bg: '#dcfce7', fg: '#166534', border: '#86efac' },
  attendance_LATE: { bg: '#ffedd5', fg: '#c2410c', border: '#fdba74' },
  attendance_ABSENT: { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  attendance_LEAVE: { bg: '#fef3c7', fg: '#b45309', border: '#fcd34d' },
  attendance_OFF: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
};

export function seedDisplayColorSettings(db) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO display_color_settings (key, label, group_key, cell_code, bg, fg, border)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const def of [...SCHEDULE_STATUS_DEFS, ...ATTENDANCE_STATUS_DEFS]) {
    const c = DEFAULT_COLORS[def.key];
    insert.run(def.key, def.label, def.group, def.cellCode, c.bg, c.fg, c.border);
  }
}

export function getDisplayColorsPayload(db) {
  const settings = db.prepare('SELECT * FROM display_color_settings ORDER BY group_key, key').all();
  const scheduleStatus = {};
  const attendanceStatus = {};

  for (const row of settings) {
    const entry = {
      bg: row.bg,
      fg: row.fg,
      border: row.border,
      label: row.label,
      cellCode: row.cell_code,
    };
    if (row.group_key === 'schedule') {
      const def = SCHEDULE_STATUS_DEFS.find((d) => d.key === row.key);
      if (def) scheduleStatus[def.status] = entry;
    } else if (row.group_key === 'attendance') {
      const def = ATTENDANCE_STATUS_DEFS.find((d) => d.key === row.key);
      if (def) attendanceStatus[def.status] = entry;
    }
  }

  const shifts = db.prepare(`
    SELECT id, code, name, start_time, end_time, color_bg, color_fg, color_border
    FROM shifts WHERE ${NOT_DELETED} ORDER BY name
  `).all().map(enrichShiftColorFields);

  return { scheduleStatus, attendanceStatus, shifts };
}

function isHexColor(v) {
  return typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v);
}

function normalizeStatusColors(colors) {
  if (!isHexColor(colors?.bg)) return null;
  const derived = deriveCellColors(colors.bg);
  return {
    bg: colors.bg,
    fg: isHexColor(colors.fg) ? colors.fg : derived.fg,
    border: isHexColor(colors.border) ? colors.border : derived.border,
  };
}

export function updateDisplayColors(db, body, userId = 'system') {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const updateSetting = db.prepare(`
    UPDATE display_color_settings SET bg = ?, fg = ?, border = ?, updated_by = ?, updated_at = ?
    WHERE key = ?
  `);
  const updateShift = db.prepare(`
    UPDATE shifts SET color_bg = ?, color_fg = ?, color_border = ?, updated_by = ?, updated_at = ?
    WHERE id = ? AND deleted_at IS NULL
  `);

  if (body.scheduleStatus) {
    for (const def of SCHEDULE_STATUS_DEFS) {
      const normalized = normalizeStatusColors(body.scheduleStatus[def.status]);
      if (!normalized) continue;
      updateSetting.run(normalized.bg, normalized.fg, normalized.border, userId, now, def.key);
    }
  }

  if (body.attendanceStatus) {
    for (const def of ATTENDANCE_STATUS_DEFS) {
      const normalized = normalizeStatusColors(body.attendanceStatus[def.status]);
      if (!normalized) continue;
      updateSetting.run(normalized.bg, normalized.fg, normalized.border, userId, now, def.key);
    }
  }

  if (Array.isArray(body.shifts)) {
    for (const s of body.shifts) {
      if (!s?.id) continue;
      const normalized = normalizeStatusColors({
        bg: s.color_bg,
        fg: s.color_fg,
        border: s.color_border,
      });
      if (!normalized) continue;
      updateShift.run(normalized.bg, normalized.fg, normalized.border, userId, now, s.id);
    }
  }

  return getDisplayColorsPayload(db);
}

export { ensureShiftDefaultColors, enrichShiftColorFields };
