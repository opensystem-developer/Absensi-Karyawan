import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'karyawan.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS karyawan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_no VARCHAR(30) NOT NULL UNIQUE,
    nik VARCHAR(20) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(150) NOT NULL,
    nama_panggilan VARCHAR(50),
    jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')),
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    agama VARCHAR(30),
    status_pernikahan VARCHAR(30),
    jumlah_anak INTEGER DEFAULT 0,
    no_kk VARCHAR(20),
    npwp VARCHAR(30),
    no_bpjs_kesehatan VARCHAR(30),
    no_bpjs_tk VARCHAR(30),
    tanggal_masuk DATE,
    tanggal_keluar DATE,
    status_karyawan VARCHAR(30) DEFAULT 'Aktif',
    alasan_keluar TEXT,
    keterangan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_karyawan_status ON karyawan(status_karyawan);
  CREATE INDEX IF NOT EXISTS idx_karyawan_nama ON karyawan(nama_lengkap);
`);

export default db;
