const STATUS_CELL = {
  OFF: 'OFF',
  LEAVE: 'CT',
  HOLIDAY: 'LN',
};

const STATUS_COLORS = {
  OFF: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
  LEAVE: { bg: '#fef3c7', fg: '#b45309', border: '#fcd34d' },
  HOLIDAY: { bg: '#ede9fe', fg: '#6d28d9', border: '#c4b5fd' },
};

const SHIFT_PALETTE = [
  { bg: '#dbeafe', fg: '#1e40af', border: '#93c5fd' },
  { bg: '#dcfce7', fg: '#166534', border: '#86efac' },
  { bg: '#ffedd5', fg: '#c2410c', border: '#fdba74' },
  { bg: '#fce7f3', fg: '#9d174d', border: '#f9a8d4' },
  { bg: '#e0e7ff', fg: '#3730a3', border: '#a5b4fc' },
  { bg: '#ccfbf1', fg: '#0f766e', border: '#5eead4' },
  { bg: '#fef9c3', fg: '#a16207', border: '#fde047' },
  { bg: '#f3e8ff', fg: '#7e22ce', border: '#d8b4fe' },
];

export function hashShiftCode(code = '') {
  let hash = 0;
  for (let i = 0; i < code.length; i += 1) {
    hash = ((hash << 5) - hash) + code.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function colorForShiftCode(code) {
  if (!code) return null;
  return SHIFT_PALETTE[hashShiftCode(code) % SHIFT_PALETTE.length];
}

export function colorForScheduleStatus(status) {
  return STATUS_COLORS[status] || null;
}

export function buildScheduleCellMap(schedules) {
  const map = new Map();
  for (const item of schedules) {
    map.set(`${item.employee_id}::${item.work_date}`, item);
  }
  return map;
}

/** Label sel: status non-WORK mengalahkan kode shift. */
export function scheduleCellLabel(item) {
  if (!item) return '';
  if (item.status && item.status !== 'WORK') {
    return STATUS_CELL[item.status] || item.status;
  }
  return item.shift_code || '';
}

export function getScheduleCellDisplay(item) {
  if (!item) {
    return { label: '', style: {}, className: 'schedule-grid-cell' };
  }

  if (item.status && item.status !== 'WORK') {
    const colors = colorForScheduleStatus(item.status);
    const statusClass = `schedule-cell-status schedule-cell-status-${item.status.toLowerCase()}`;
    return {
      label: STATUS_CELL[item.status] || item.status,
      className: `schedule-grid-cell schedule-grid-filled ${statusClass}`,
      style: colors ? {
        backgroundColor: colors.bg,
        color: colors.fg,
        borderColor: colors.border,
      } : {},
    };
  }

  const code = item.shift_code || '';
  const colors = colorForShiftCode(code);
  const paletteIndex = code ? hashShiftCode(code) % SHIFT_PALETTE.length : 0;

  return {
    label: code,
    className: `schedule-grid-cell schedule-grid-filled schedule-cell-shift schedule-cell-shift-${paletteIndex}`,
    style: colors ? {
      backgroundColor: colors.bg,
      color: colors.fg,
      borderColor: colors.border,
    } : {},
  };
}

export function legendColorForShift(shift) {
  return colorForShiftCode(shift?.code);
}

export function legendColorForStatusCode(code) {
  const map = { OFF: 'OFF', CT: 'LEAVE', LN: 'HOLIDAY' };
  return colorForScheduleStatus(map[code]);
}

export { STATUS_CELL, SHIFT_PALETTE, STATUS_COLORS };
