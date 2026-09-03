import { NOT_DELETED } from './audit.js';

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

const SHIFT_FALLBACK = [
  { bg: '#dbeafe', fg: '#1e40af', border: '#93c5fd' },
  { bg: '#dcfce7', fg: '#166534', border: '#86efac' },
  { bg: '#ffedd5', fg: '#c2410c', border: '#fdba74' },
  { bg: '#fce7f3', fg: '#9d174d', border: '#f9a8d4' },
  { bg: '#e0e7ff', fg: '#3730a3', border: '#a5b4fc' },
  { bg: '#ccfbf1', fg: '#0f766e', border: '#5eead4' },
  { bg: '#fef9c3', fg: '#a16207', border: '#fde047' },
  { bg: '#f3e8ff', fg: '#7e22ce', border: '#d8b4fe' },
];

export function hashCode(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function fallbackShiftColor(code) {
  if (!code) return null;
  return SHIFT_FALLBACK[hashCode(code) % SHIFT_FALLBACK.length];
}

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
  `).all();

  return { scheduleStatus, attendanceStatus, shifts };
}

function isHexColor(v) {
  return typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v);
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
      const c = body.scheduleStatus[def.status];
      if (!c) continue;
      if (!isHexColor(c.bg) || !isHexColor(c.fg)) continue;
      updateSetting.run(c.bg, c.fg, isHexColor(c.border) ? c.border : c.bg, userId, now, def.key);
    }
  }

  if (body.attendanceStatus) {
    for (const def of ATTENDANCE_STATUS_DEFS) {
      const c = body.attendanceStatus[def.status];
      if (!c) continue;
      if (!isHexColor(c.bg) || !isHexColor(c.fg)) continue;
      updateSetting.run(c.bg, c.fg, isHexColor(c.border) ? c.border : c.bg, userId, now, def.key);
    }
  }

  if (Array.isArray(body.shifts)) {
    for (const s of body.shifts) {
      if (!s.id) continue;
      const bg = isHexColor(s.color_bg) ? s.color_bg : null;
      const fg = isHexColor(s.color_fg) ? s.color_fg : null;
      const border = isHexColor(s.color_border) ? s.color_border : null;
      updateShift.run(bg, fg, border, userId, now, s.id);
    }
  }

  return getDisplayColorsPayload(db);
}
