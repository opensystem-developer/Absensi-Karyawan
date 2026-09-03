export function parseHex(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const h = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function hexFromRgb(r, g, b) {
  return `#${[r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')}`;
}

export function deriveCellColors(bg) {
  const rgb = parseHex(bg);
  if (!rgb) return { bg: bg || '#4F81BD', fg: '#1e293b', border: '#93c5fd' };

  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  const fg = lum > 0.55 ? '#1e293b' : '#f8fafc';
  const shift = lum > 0.55 ? -28 : 28;
  const border = hexFromRgb(rgb.r + shift, rgb.g + shift, rgb.b + shift);

  return { bg, fg, border };
}

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
  if (shift.color_bg) {
    const derived = deriveCellColors(shift.color_bg);
    return {
      ...shift,
      color_fg: derived.fg,
      color_border: shift.color_border || derived.border,
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

export function ensureShiftDefaultColors(db) {
  const rows = db.prepare(`
    SELECT id, code FROM shifts
    WHERE deleted_at IS NULL AND (color_bg IS NULL OR color_fg IS NULL)
  `).all();

  const update = db.prepare(`
    UPDATE shifts SET color_bg = ?, color_fg = ?, color_border = ?, updated_by = 'system', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  for (const row of rows) {
    const colors = defaultShiftColorForCode(row.code);
    update.run(colors.bg, colors.fg, colors.border, row.id);
  }
}
