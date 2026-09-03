-- Goodis ERP — hr schema (modul absensi / karyawan)
-- Jalankan setelah 002_core.sql
-- Nama tabel `karyawan` dipertahankan agar minim breaking change di kode

CREATE TABLE IF NOT EXISTS hr.employment_statuses (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(30) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  created_by  VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  VARCHAR(100),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by  VARCHAR(100),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr.karyawan (
  id                  BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT REFERENCES core.branches(id),
  employee_no         VARCHAR(30) NOT NULL UNIQUE,
  nik                 VARCHAR(20) NOT NULL UNIQUE,
  nama_lengkap        VARCHAR(150) NOT NULL,
  nama_panggilan      VARCHAR(50),
  jenis_kelamin       CHAR(1) CHECK (jenis_kelamin IN ('L', 'P')),
  tempat_lahir        VARCHAR(100),
  tanggal_lahir        DATE,
  agama               VARCHAR(30),
  status_pernikahan   VARCHAR(30),
  jumlah_anak         INTEGER DEFAULT 0,
  no_kk               VARCHAR(20),
  npwp                VARCHAR(30),
  no_bpjs_kesehatan   VARCHAR(30),
  no_bpjs_tk          VARCHAR(30),
  tanggal_masuk       DATE,
  tanggal_keluar      DATE,
  status_karyawan     VARCHAR(30) DEFAULT 'Aktif',
  alasan_keluar       TEXT,
  keterangan          TEXT,
  created_by          VARCHAR(100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          VARCHAR(100),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by          VARCHAR(100),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_karyawan_status ON hr.karyawan(status_karyawan);
CREATE INDEX IF NOT EXISTS idx_karyawan_branch ON hr.karyawan(branch_id);

CREATE TABLE IF NOT EXISTS hr.employee_positions (
  id                    BIGSERIAL PRIMARY KEY,
  employee_id           BIGINT NOT NULL REFERENCES hr.karyawan(id),
  company_id            BIGINT NOT NULL REFERENCES core.companies(id),
  branch_id             BIGINT NOT NULL REFERENCES core.branches(id),
  department_id         BIGINT NOT NULL REFERENCES core.departments(id),
  position_id           BIGINT NOT NULL REFERENCES core.positions(id),
  employment_status_id  BIGINT NOT NULL REFERENCES hr.employment_statuses(id),
  start_date            DATE,
  end_date              DATE,
  is_current            BOOLEAN NOT NULL DEFAULT FALSE,
  reason                TEXT,
  created_by            VARCHAR(100),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by            VARCHAR(100),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by            VARCHAR(100),
  deleted_at            TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr.employee_contracts (
  id            BIGSERIAL PRIMARY KEY,
  employee_id   BIGINT NOT NULL REFERENCES hr.karyawan(id),
  contract_no   VARCHAR(50) NOT NULL,
  type          VARCHAR(30) NOT NULL,
  start_date    DATE,
  end_date      DATE,
  status        VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  document_path TEXT,
  created_by    VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    VARCHAR(100),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by    VARCHAR(100),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr.alamat_karyawan (
  id          BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr.karyawan(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('KTP', 'DOMISILI')),
  alamat      TEXT NOT NULL,
  rt          VARCHAR(10),
  rw          VARCHAR(10),
  kelurahan   VARCHAR(100),
  kecamatan   VARCHAR(100),
  kota        VARCHAR(100),
  provinsi    VARCHAR(100),
  kode_pos    VARCHAR(10),
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  VARCHAR(100),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by  VARCHAR(100),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alamat_employee ON hr.alamat_karyawan(employee_id);

CREATE TABLE IF NOT EXISTS hr.kontak_karyawan (
  id            BIGSERIAL PRIMARY KEY,
  employee_id   BIGINT NOT NULL REFERENCES hr.karyawan(id) ON DELETE CASCADE,
  type          VARCHAR(30) NOT NULL CHECK (type IN ('PERSONAL', 'EMERGENCY')),
  nama          VARCHAR(150) NOT NULL,
  hubungan      VARCHAR(50),
  nomor_telepon VARCHAR(30),
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  keterangan    TEXT,
  created_by    VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    VARCHAR(100),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by    VARCHAR(100),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr.keluarga_karyawan (
  id            BIGSERIAL PRIMARY KEY,
  employee_id   BIGINT NOT NULL REFERENCES hr.karyawan(id) ON DELETE CASCADE,
  nama          VARCHAR(150) NOT NULL,
  hubungan      VARCHAR(50),
  jenis_kelamin CHAR(1) CHECK (jenis_kelamin IN ('L', 'P')),
  tanggal_lahir  DATE,
  pekerjaan     VARCHAR(100),
  keterangan    TEXT,
  created_by    VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    VARCHAR(100),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by    VARCHAR(100),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr.pendidikan_karyawan (
  id           BIGSERIAL PRIMARY KEY,
  employee_id  BIGINT NOT NULL REFERENCES hr.karyawan(id) ON DELETE CASCADE,
  tingkat      VARCHAR(30) NOT NULL,
  nama_sekolah VARCHAR(200) NOT NULL,
  jurusan      VARCHAR(150),
  tahun_lulus  INTEGER,
  keterangan   TEXT,
  created_by   VARCHAR(100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by   VARCHAR(100),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by   VARCHAR(100),
  deleted_at   TIMESTAMPTZ
);

-- ─── Shifts & attendance ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr.shifts (
  id                          BIGSERIAL PRIMARY KEY,
  code                        VARCHAR(30) NOT NULL UNIQUE,
  name                        VARCHAR(100) NOT NULL,
  start_time                  VARCHAR(8) NOT NULL,
  end_time                    VARCHAR(8) NOT NULL,
  break_start                 VARCHAR(8),
  break_end                   VARCHAR(8),
  late_tolerance_minutes      INTEGER NOT NULL DEFAULT 0,
  early_out_tolerance_minutes INTEGER NOT NULL DEFAULT 0,
  status                      SMALLINT NOT NULL DEFAULT 1,
  color_bg                    VARCHAR(7),
  color_fg                    VARCHAR(7),
  color_border                VARCHAR(7),
  created_by                  VARCHAR(100),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by                  VARCHAR(100),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by                  VARCHAR(100),
  deleted_at                  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr.employee_shifts (
  id               BIGSERIAL PRIMARY KEY,
  employee_id      BIGINT NOT NULL REFERENCES hr.karyawan(id),
  shift_id         BIGINT NOT NULL REFERENCES hr.shifts(id),
  effective_from   DATE,
  effective_to     DATE,
  monthly_off_days INTEGER NOT NULL DEFAULT 4,
  created_by       VARCHAR(100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by       VARCHAR(100),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by       VARCHAR(100),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee ON hr.employee_shifts(employee_id);

CREATE TABLE IF NOT EXISTS hr.work_schedules (
  id          BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES hr.karyawan(id),
  work_date   DATE NOT NULL,
  shift_id    BIGINT NOT NULL REFERENCES hr.shifts(id),
  start_time  VARCHAR(8),
  end_time    VARCHAR(8),
  status      VARCHAR(20) NOT NULL DEFAULT 'WORK'
              CHECK (status IN ('WORK', 'OFF', 'LEAVE', 'HOLIDAY')),
  created_by  VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  VARCHAR(100),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by  VARCHAR(100),
  deleted_at  TIMESTAMPTZ,
  UNIQUE (employee_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_work_schedules_employee_date ON hr.work_schedules(employee_id, work_date);

CREATE TABLE IF NOT EXISTS hr.attendances (
  id                 BIGSERIAL PRIMARY KEY,
  employee_id        BIGINT NOT NULL REFERENCES hr.karyawan(id),
  work_date          DATE NOT NULL,
  schedule_id        BIGINT REFERENCES hr.work_schedules(id),
  clock_in           TIMESTAMPTZ,
  clock_out          TIMESTAMPTZ,
  late_minutes       INTEGER NOT NULL DEFAULT 0,
  early_out_minutes  INTEGER NOT NULL DEFAULT 0,
  overtime_minutes   INTEGER NOT NULL DEFAULT 0,
  status             VARCHAR(30) NOT NULL DEFAULT 'PRESENT'
                     CHECK (status IN ('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'OFF')),
  anomaly_flag       BOOLEAN NOT NULL DEFAULT FALSE,
  anomaly_reason     TEXT,
  created_by         VARCHAR(100),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by         VARCHAR(100),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by         VARCHAR(100),
  deleted_at         TIMESTAMPTZ,
  UNIQUE (employee_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_attendances_employee_date ON hr.attendances(employee_id, work_date);

CREATE TABLE IF NOT EXISTS hr.display_color_settings (
  key        VARCHAR(50) PRIMARY KEY,
  label      VARCHAR(100) NOT NULL,
  group_key  VARCHAR(30) NOT NULL,
  cell_code  VARCHAR(10) NOT NULL,
  bg         VARCHAR(7) NOT NULL,
  fg         VARCHAR(7) NOT NULL,
  border     VARCHAR(7),
  updated_by VARCHAR(100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- View alias untuk migrasi bertahap (opsional)
CREATE OR REPLACE VIEW hr.employees AS SELECT * FROM hr.karyawan;
