import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from './utils/migrate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'karyawan.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const AUDIT_COLS = `
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME`;

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
    ${AUDIT_COLS}
  );

  CREATE INDEX IF NOT EXISTS idx_karyawan_status ON karyawan(status_karyawan);
  CREATE INDEX IF NOT EXISTS idx_karyawan_nama ON karyawan(nama_lengkap);

  CREATE TABLE IF NOT EXISTS alamat_karyawan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK(type IN ('KTP', 'DOMISILI')),
    alamat TEXT NOT NULL,
    rt VARCHAR(10),
    rw VARCHAR(10),
    kelurahan VARCHAR(100),
    kecamatan VARCHAR(100),
    kota VARCHAR(100),
    provinsi VARCHAR(100),
    kode_pos VARCHAR(10),
    is_primary INTEGER NOT NULL DEFAULT 0,
    ${AUDIT_COLS},
    FOREIGN KEY (employee_id) REFERENCES karyawan(id)
  );

  CREATE INDEX IF NOT EXISTS idx_alamat_employee ON alamat_karyawan(employee_id);

  CREATE TABLE IF NOT EXISTS kontak_karyawan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    type VARCHAR(30) NOT NULL CHECK(type IN ('PERSONAL', 'EMERGENCY')),
    nama VARCHAR(150) NOT NULL,
    hubungan VARCHAR(50),
    nomor_telepon VARCHAR(30),
    is_primary INTEGER NOT NULL DEFAULT 0,
    keterangan TEXT,
    ${AUDIT_COLS},
    FOREIGN KEY (employee_id) REFERENCES karyawan(id)
  );

  CREATE INDEX IF NOT EXISTS idx_kontak_employee ON kontak_karyawan(employee_id);

  CREATE TABLE IF NOT EXISTS keluarga_karyawan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    nama VARCHAR(150) NOT NULL,
    hubungan VARCHAR(50),
    jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')),
    tanggal_lahir DATE,
    pekerjaan VARCHAR(100),
    keterangan TEXT,
    ${AUDIT_COLS},
    FOREIGN KEY (employee_id) REFERENCES karyawan(id)
  );

  CREATE INDEX IF NOT EXISTS idx_keluarga_employee ON keluarga_karyawan(employee_id);

  CREATE TABLE IF NOT EXISTS pendidikan_karyawan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    tingkat VARCHAR(30) NOT NULL,
    nama_sekolah VARCHAR(200) NOT NULL,
    jurusan VARCHAR(150),
    tahun_lulus INTEGER,
    keterangan TEXT,
    ${AUDIT_COLS},
    FOREIGN KEY (employee_id) REFERENCES karyawan(id)
  );

  CREATE INDEX IF NOT EXISTS idx_pendidikan_employee ON pendidikan_karyawan(employee_id);
`);

runMigrations(db);

export default db;
