/** Parse YYYY-MM-DD tanpa konversi timezone */
function parseIsoParts(dateStr) {
  if (!dateStr) return null;
  const m = String(dateStr).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return { year: m[1], month: m[2], day: m[3] };
}

/** Parse dd/mm/yyyy */
function parseDisplayParts(dateStr) {
  if (!dateStr) return null;
  const m = String(dateStr).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return { day: m[1], month: m[2], year: m[3] };
}

/** Tampilkan tanggal sebagai dd/mm/yyyy */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const iso = parseIsoParts(dateStr);
  if (iso) return `${iso.day}/${iso.month}/${iso.year}`;
  const display = parseDisplayParts(dateStr);
  if (display) return `${display.day}/${display.month}/${display.year}`;
  return '-';
}

/** Tampilkan datetime sebagai dd/mm/yyyy HH:mm */
export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const s = String(dateStr).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`;
  return '-';
}

/** ISO (YYYY-MM-DD) → dd/mm/yyyy untuk input form */
export function toDisplayDate(dateStr) {
  if (!dateStr) return '';
  const iso = parseIsoParts(dateStr);
  if (iso) return `${iso.day}/${iso.month}/${iso.year}`;
  const display = parseDisplayParts(dateStr);
  if (display) return `${display.day}/${display.month}/${display.year}`;
  return '';
}

/** dd/mm/yyyy → ISO (YYYY-MM-DD) untuk API */
export function toIsoDate(displayStr) {
  if (!displayStr) return '';
  const trimmed = String(displayStr).trim();
  const display = parseDisplayParts(trimmed);
  if (display) return `${display.year}-${display.month}-${display.day}`;
  const iso = parseIsoParts(trimmed);
  if (iso) return `${iso.year}-${iso.month}-${iso.day}`;
  return '';
}

/** Normalisasi nilai dari DB ke ISO untuk state form */
export function toInputDate(dateStr) {
  return toIsoDate(toDisplayDate(dateStr)) || (parseIsoParts(dateStr) ? dateStr.slice(0, 10) : '');
}

/** Format input saat mengetik: auto tambah slash */
export function maskDateInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function isValidDisplayDate(displayStr) {
  const p = parseDisplayParts(displayStr);
  if (!p) return false;
  const d = new Date(parseInt(p.year, 10), parseInt(p.month, 10) - 1, parseInt(p.day, 10));
  return d.getFullYear() === parseInt(p.year, 10)
    && d.getMonth() === parseInt(p.month, 10) - 1
    && d.getDate() === parseInt(p.day, 10);
}

/** Format nilai jika berupa tanggal ISO */
export function formatMaybeDate(val) {
  if (val === null || val === undefined || val === '') return '-';
  if (/^\d{4}-\d{2}-\d{2}/.test(String(val))) return formatDate(val);
  return String(val);
}
