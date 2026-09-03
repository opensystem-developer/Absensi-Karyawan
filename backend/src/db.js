import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from './utils/migrate.js';
import { seedDatabase } from './seed.js';

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
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    permissions TEXT NOT NULL DEFAULT '[]',
    ${AUDIT_COLS}
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role_id INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    ${AUDIT_COLS},
    FOREIGN KEY (role_id) REFERENCES roles(id)
  );

  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    status INTEGER NOT NULL DEFAULT 1,
    ${AUDIT_COLS}
  );

  CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    status INTEGER NOT NULL DEFAULT 1,
    ${AUDIT_COLS},
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    scope VARCHAR(20) NOT NULL DEFAULT 'BRANCH' CHECK(scope IN ('ALL', 'BRANCH')),
    status INTEGER NOT NULL DEFAULT 1,
    ${AUDIT_COLS}
  );

  CREATE TABLE IF NOT EXISTS department_branches (
    department_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    PRIMARY KEY (department_id, branch_id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(50),
    status INTEGER NOT NULL DEFAULT 1,
    ${AUDIT_COLS},
    FOREIGN KEY (department_id) REFERENCES departments(id),
    UNIQUE(department_id, code)
  );

  CREATE TABLE IF NOT EXISTS employment_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    ${AUDIT_COLS}
  );

  CREATE TABLE IF NOT EXISTS karyawan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER,
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
    ${AUDIT_COLS},
    FOREIGN KEY (branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS employee_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    position_id INTEGER NOT NULL,
    employment_status_id INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current INTEGER NOT NULL DEFAULT 0,
    reason TEXT,
    ${AUDIT_COLS},
    FOREIGN KEY (employee_id) REFERENCES karyawan(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (position_id) REFERENCES positions(id),
    FOREIGN KEY (employment_status_id) REFERENCES employment_statuses(id)
  );

  CREATE TABLE IF NOT EXISTS employee_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    contract_no VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    document_path TEXT,
    ${AUDIT_COLS},
    FOREIGN KEY (employee_id) REFERENCES karyawan(id)
  );

  CREATE TABLE IF NOT EXISTS alamat_karyawan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK(type IN ('KTP', 'DOMISILI')),
    alamat TEXT NOT NULL,
    rt VARCHAR(10), rw VARCHAR(10),
    kelurahan VARCHAR(100), kecamatan VARCHAR(100),
    kota VARCHAR(100), provinsi VARCHAR(100), kode_pos VARCHAR(10),
    is_primary INTEGER NOT NULL DEFAULT 0,
    ${AUDIT_COLS},
    FOREIGN KEY (employee_id) REFERENCES karyawan(id)
  );

  CREATE TABLE IF NOT EXISTS kontak_karyawan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    type VARCHAR(30) NOT NULL CHECK(type IN ('PERSONAL', 'EMERGENCY')),
    nama VARCHAR(150) NOT NULL,
    hubungan VARCHAR(50), nomor_telepon VARCHAR(30),
    is_primary INTEGER NOT NULL DEFAULT 0, keterangan TEXT,
    ${AUDIT_COLS},
    FOREIGN KEY (employee_id) REFERENCES karyawan(id)
  );

  CREATE TABLE IF NOT EXISTS keluarga_karyawan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    nama VARCHAR(150) NOT NULL,
    hubungan VARCHAR(50),
    jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')),
    tanggal_lahir DATE, pekerjaan VARCHAR(100), keterangan TEXT,
    ${AUDIT_COLS},
    FOREIGN KEY (employee_id) REFERENCES karyawan(id)
  );

  CREATE TABLE IF NOT EXISTS pendidikan_karyawan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    tingkat VARCHAR(30) NOT NULL,
    nama_sekolah VARCHAR(200) NOT NULL,
    jurusan VARCHAR(150), tahun_lulus INTEGER, keterangan TEXT,
    ${AUDIT_COLS},
    FOREIGN KEY (employee_id) REFERENCES karyawan(id)
  );

  CREATE TABLE IF NOT EXISTS user_activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50),
    entity_id INTEGER,
    description TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS data_change_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    employee_id INTEGER,
    action VARCHAR(20) NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(100),
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_karyawan_status ON karyawan(status_karyawan);
  CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_log(user_id);
  CREATE INDEX IF NOT EXISTS idx_change_employee ON data_change_history(employee_id);
  CREATE INDEX IF NOT EXISTS idx_change_table ON data_change_history(table_name, record_id);
`);

runMigrations(db);
seedDatabase(db);

export default db;
