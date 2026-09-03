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
  if (!rgb) return { bg: bg || '#dbeafe', fg: '#1e293b', border: '#93c5fd' };

  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  const fg = lum > 0.55 ? '#1e293b' : '#f8fafc';
  const shift = lum > 0.55 ? -28 : 28;
  const border = hexFromRgb(rgb.r + shift, rgb.g + shift, rgb.b + shift);

  return { bg, fg, border };
}
