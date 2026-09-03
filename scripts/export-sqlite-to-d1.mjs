#!/usr/bin/env node
/**
 * Export data dari SQLite lokal ke file SQL untuk import ke Cloudflare D1.
 *
 * Usage:
 *   node scripts/export-sqlite-to-d1.mjs
 *   node scripts/export-sqlite-to-d1.mjs --db backend/data/karyawan.db --out migrations/0002_data.sql
 *
 * Import ke D1 (setelah schema):
 *   npx wrangler d1 execute absensi-karyawan-db --remote --file=migrations/0002_data.sql
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}

const dbPath = path.resolve(root, arg('--db', 'backend/data/karyawan.db'));
const outPath = path.resolve(root, arg('--out', 'migrations/0002_data.sql'));

if (!fs.existsSync(dbPath)) {
  console.error(`Database tidak ditemukan: ${dbPath}`);
  console.error('Jalankan backend sekali atau npm run seed:dummy terlebih dahulu.');
  process.exit(1);
}

const tables = execSync(`sqlite3 "${dbPath}" "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name"`, { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

const lines = [
  '-- Data export untuk Cloudflare D1',
  `-- Source: ${dbPath}`,
  `-- Generated: ${new Date().toISOString()}`,
  'PRAGMA foreign_keys = OFF;',
  '',
];

for (const table of tables) {
  const dump = execSync(`sqlite3 "${dbPath}" ".mode insert ${table}" "SELECT * FROM ${table}"`, { encoding: 'utf8' }).trim();
  if (!dump) continue;
  lines.push(`-- ${table}`);
  lines.push(dump);
  lines.push('');
}

lines.push('PRAGMA foreign_keys = ON;');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join('\n'));
console.log(`Exported ${tables.length} tables → ${outPath}`);
console.log('Import: npx wrangler d1 execute absensi-karyawan-db --remote --file=migrations/0002_data.sql');
