import { parseHex, hexFromRgb } from './colorUtils';

/** Warna tema ala Excel (10 kolom). */
export const THEME_BASE_COLORS = [
  '#FFFFFF',
  '#000000',
  '#EEECE1',
  '#1F497D',
  '#4F81BD',
  '#C0504D',
  '#9BBB59',
  '#8064A2',
  '#4BACC6',
  '#F79646',
];

/** Warna standar ala Excel. */
export const STANDARD_COLORS = [
  '#C00000',
  '#FF0000',
  '#FFC000',
  '#FFFF00',
  '#92D050',
  '#00B050',
  '#00B0F0',
  '#0070C0',
  '#002060',
  '#7030A0',
];

export const AUTOMATIC_COLOR = '#000000';

function mixWithWhite(hex, ratio) {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return hexFromRgb(
    rgb.r + (255 - rgb.r) * ratio,
    rgb.g + (255 - rgb.g) * ratio,
    rgb.b + (255 - rgb.b) * ratio,
  );
}

function mixWithBlack(hex, ratio) {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return hexFromRgb(rgb.r * (1 - ratio), rgb.g * (1 - ratio), rgb.b * (1 - ratio));
}

/** 6 baris per kolom: base + 4 tint + 1 shade (seperti Excel). */
export function buildThemeColorGrid() {
  return THEME_BASE_COLORS.map((base) => [
    base,
    mixWithWhite(base, 0.25),
    mixWithWhite(base, 0.5),
    mixWithWhite(base, 0.75),
    mixWithBlack(base, 0.25),
    mixWithBlack(base, 0.5),
  ]);
}

export function normalizeHex(hex) {
  if (!hex || typeof hex !== 'string') return '';
  const h = hex.trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(h)) return h;
  if (/^[0-9A-F]{6}$/.test(h)) return `#${h}`;
  return '';
}

export function colorsMatch(a, b) {
  return normalizeHex(a) === normalizeHex(b);
}

export const ALL_PALETTE_COLORS = [
  AUTOMATIC_COLOR,
  ...buildThemeColorGrid().flat(),
  ...STANDARD_COLORS,
];
