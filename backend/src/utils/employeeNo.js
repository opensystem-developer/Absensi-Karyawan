import { NOT_DELETED } from './audit.js';

const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGS', 'SEP', 'OKT', 'NOV', 'DES'];

function parseRefDate(dateStr) {
  if (dateStr) {
    const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return { year: parseInt(m[1], 10), month: parseInt(m[2], 10) };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function buildEmployeeNoSuffix(branchCode, month, year) {
  const monthAbbr = MONTH_ABBR[month - 1];
  const yearShort = String(year % 100).padStart(2, '0');
  return `/${branchCode}/${monthAbbr}/${yearShort}`;
}

export function generateEmployeeNo(db, branchId, tanggalMasuk = null) {
  const branch = db.prepare(`SELECT id, code FROM branches WHERE id = ? AND ${NOT_DELETED}`).get(branchId);
  if (!branch) throw Object.assign(new Error('Cabang tidak ditemukan'), { status: 404 });

  const { year, month } = parseRefDate(tanggalMasuk);
  const suffix = buildEmployeeNoSuffix(branch.code, month, year);
  const likePattern = `%${suffix}`;

  const row = db.prepare(`
    SELECT COUNT(*) as c FROM karyawan
    WHERE employee_no LIKE ? AND ${NOT_DELETED}
  `).get(likePattern);

  const seq = String((row.c || 0) + 1).padStart(5, '0');
  return `${seq}${suffix}`;
}

export { MONTH_ABBR };
