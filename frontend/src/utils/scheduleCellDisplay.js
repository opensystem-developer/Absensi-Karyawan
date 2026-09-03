import { getShiftColors, hashShiftCode } from './shiftColors';

const STATUS_CELL = {
  OFF: 'OFF',
  LEAVE: 'CT',
  HOLIDAY: 'LN',
};

const DEFAULT_STATUS_COLORS = {
  OFF: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
  LEAVE: { bg: '#fef3c7', fg: '#b45309', border: '#fcd34d' },
  HOLIDAY: { bg: '#ede9fe', fg: '#6d28d9', border: '#c4b5fd' },
};

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

export function colorForScheduleStatusFromConfig(config, status) {
  const entry = config?.scheduleStatus?.[status];
  if (entry?.bg && entry?.fg) {
    return { bg: entry.bg, fg: entry.fg, border: entry.border || entry.bg };
  }
  return DEFAULT_STATUS_COLORS[status] || null;
}

export function colorForShiftFromConfig(config, code, shiftsByCode = {}) {
  return getShiftColors(code, shiftsByCode, config);
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
  const colors = getShiftColors(code, shiftsByCode, colorConfig);
  const paletteIndex = code ? hashShiftCode(code) % 12 : 0;

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
  return getShiftColors(shift?.code, shiftsByCode, config);
}

export function legendColorForStatusCode(config, code) {
  const map = { OFF: 'OFF', CT: 'LEAVE', LN: 'HOLIDAY' };
  return colorForScheduleStatusFromConfig(config, map[code]);
}

export { STATUS_CELL };
