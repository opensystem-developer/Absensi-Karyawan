import { deriveCellColors } from './colorUtils';

/** Palet default shift — sama di grid, legenda, dan database. */
export const SHIFT_DEFAULT_PALETTE = [
  '#4F81BD',
  '#C0504D',
  '#9BBB59',
  '#8064A2',
  '#4BACC6',
  '#F79646',
  '#0070C0',
  '#00B050',
  '#FFC000',
  '#FF0000',
  '#7030A0',
  '#002060',
];

export function hashShiftCode(code = '') {
  let hash = 0;
  for (let i = 0; i < code.length; i += 1) {
    hash = ((hash << 5) - hash) + code.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function defaultShiftColorForCode(code) {
  const palette = SHIFT_DEFAULT_PALETTE;
  const idx = code ? hashShiftCode(code) % palette.length : 0;
  return deriveCellColors(palette[idx]);
}

export function enrichShiftColorFields(shift) {
  if (!shift) return shift;
  if (shift.color_bg && shift.color_fg) {
    return {
      ...shift,
      color_border: shift.color_border || shift.color_bg,
    };
  }
  const defaults = defaultShiftColorForCode(shift.code);
  return {
    ...shift,
    color_bg: defaults.bg,
    color_fg: defaults.fg,
    color_border: defaults.border,
  };
}

export function getShiftColors(code, shiftsByCode = {}, config = null) {
  const shift = shiftsByCode[code] || config?.shifts?.find((s) => s.code === code);
  if (shift?.color_bg && shift?.color_fg) {
    return {
      bg: shift.color_bg,
      fg: shift.color_fg,
      border: shift.color_border || shift.color_bg,
    };
  }
  return defaultShiftColorForCode(code);
}
