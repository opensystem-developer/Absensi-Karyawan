const STATUS_CELL = {
  OFF: 'OFF',
  LEAVE: 'CT',
  HOLIDAY: 'LN',
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

const DEFAULT_STATUS_COLORS = {
  OFF: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
  LEAVE: { bg: '#fef3c7', fg: '#b45309', border: '#fcd34d' },
  HOLIDAY: { bg: '#ede9fe', fg: '#6d28d9', border: '#c4b5fd' },
};

export function hashShiftCode(code = '') {
  let hash = 0;
  for (let i = 0; i < code.length; i += 1) {
    hash = ((hash << 5) - hash) + code.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function fallbackShiftColor(code) {
  if (!code) return null;
  return SHIFT_PALETTE[hashShiftCode(code) % SHIFT_PALETTE.length];
}

export function buildScheduleCellMap(schedules) {
  const map = new Map();
  for (const item of schedules) {
    map.set(`${item.employee_id}::${item.work_date}`, item);
  }
  return map;
}

export function scheduleCellLabel(item) {
  if (!item) return '';
  if (item.status && item.status !== 'WORK') {
    return STATUS_CELL[item.status] || item.status;
  }
  return item.shift_code || '';
}

function colorStyle(colors) {
  if (!colors) return {};
  return {
    backgroundColor: colors.bg,
    color: colors.fg,
    borderColor: colors.border || colors.bg,
  };
}

export function colorForShiftFromConfig(config, code, shiftsByCode = {}) {
  const shift = shiftsByCode[code] || config?.shifts?.find((s) => s.code === code);
  if (shift?.color_bg && shift?.color_fg) {
    return {
      bg: shift.color_bg,
      fg: shift.color_fg,
      border: shift.color_border || shift.color_bg,
    };
  }
  return fallbackShiftColor(code);
}

export function colorForScheduleStatusFromConfig(config, status) {
  const entry = config?.scheduleStatus?.[status];
  if (entry?.bg && entry?.fg) {
    return { bg: entry.bg, fg: entry.fg, border: entry.border || entry.bg };
  }
  return DEFAULT_STATUS_COLORS[status] || null;
}

export function getScheduleCellDisplay(item, colorConfig = null, shiftsByCode = {}) {
  if (!item) {
    return { label: '', style: {}, className: 'schedule-grid-cell' };
  }

  if (item.status && item.status !== 'WORK') {
    const colors = colorForScheduleStatusFromConfig(colorConfig, item.status);
    return {
      label: STATUS_CELL[item.status] || item.status,
      className: `schedule-grid-cell schedule-grid-filled schedule-cell-status schedule-cell-status-${item.status.toLowerCase()}`,
      style: colorStyle(colors),
    };
  }

  const code = item.shift_code || '';
  const colors = colorForShiftFromConfig(colorConfig, code, shiftsByCode);
  const paletteIndex = code ? hashShiftCode(code) % SHIFT_PALETTE.length : 0;

  return {
    label: code,
    className: `schedule-grid-cell schedule-grid-filled schedule-cell-shift schedule-cell-shift-${paletteIndex}`,
    style: colorStyle(colors),
  };
}

export function legendColorForScheduleStatus(config, status) {
  return colorForScheduleStatusFromConfig(config, status);
}

export function legendColorForShift(config, shift, shiftsByCode = {}) {
  return colorForShiftFromConfig(config, shift?.code, shiftsByCode);
}

export function legendColorForStatusCode(config, code) {
  const map = { OFF: 'OFF', CT: 'LEAVE', LN: 'HOLIDAY' };
  return colorForScheduleStatusFromConfig(config, map[code]);
}

export { STATUS_CELL, SHIFT_PALETTE };
