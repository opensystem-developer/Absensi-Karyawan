import { NOT_DELETED } from './audit.js';

const MASTER_CHECKS = [
  { key: 'companies', table: 'companies', label: 'Perusahaan', path: '/perusahaan' },
  { key: 'branches', table: 'branches', label: 'Cabang', path: '/cabang' },
  { key: 'departments', table: 'departments', label: 'Departemen', path: '/departemen' },
  { key: 'positions', table: 'positions', label: 'Jabatan', path: '/jabatan' },
  { key: 'employment_statuses', table: 'employment_statuses', label: 'Status Karyawan', path: '/status-karyawan' },
];

export function checkMasterDataReady(db) {
  const missing = [];
  for (const check of MASTER_CHECKS) {
    const row = db.prepare(`SELECT COUNT(*) as c FROM ${check.table} WHERE ${NOT_DELETED}`).get();
    if (row.c === 0) missing.push({ label: check.label, path: check.path });
  }
  return { ready: missing.length === 0, missing, steps: MASTER_CHECKS.map((c) => c.label) };
}

export function assertMasterDataReady(db) {
  const status = checkMasterDataReady(db);
  if (!status.ready) {
    const labels = status.missing.map((m) => m.label).join(', ');
    throw Object.assign(new Error(`Lengkapi master data terlebih dahulu: ${labels}`), { status: 400 });
  }
}
