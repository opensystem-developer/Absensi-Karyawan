-- D1 schema migration (exported from local SQLite)

CREATE TABLE karyawan (
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
  , created_by VARCHAR(100), updated_by VARCHAR(100), deleted_by VARCHAR(100), deleted_at DATETIME, branch_id INTEGER REFERENCES branches(id));
CREATE INDEX idx_karyawan_status ON karyawan(status_karyawan);
CREATE INDEX idx_karyawan_nama ON karyawan(nama_lengkap);
CREATE TABLE alamat_karyawan (
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, created_by VARCHAR(100), updated_by VARCHAR(100), deleted_by VARCHAR(100), deleted_at DATETIME,
    FOREIGN KEY (employee_id) REFERENCES karyawan(id) ON DELETE CASCADE
  );
CREATE INDEX idx_alamat_employee ON alamat_karyawan(employee_id);
CREATE INDEX idx_alamat_primary ON alamat_karyawan(employee_id, is_primary);
CREATE TABLE kontak_karyawan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    type VARCHAR(30) NOT NULL CHECK(type IN ('PERSONAL', 'EMERGENCY')),
    nama VARCHAR(150) NOT NULL,
    hubungan VARCHAR(50),
    nomor_telepon VARCHAR(30),
    is_primary INTEGER NOT NULL DEFAULT 0,
    keterangan TEXT,
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME,
    FOREIGN KEY (employee_id) REFERENCES karyawan(id)
  );
CREATE INDEX idx_kontak_employee ON kontak_karyawan(employee_id);
CREATE TABLE keluarga_karyawan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    nama VARCHAR(150) NOT NULL,
    hubungan VARCHAR(50),
    jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')),
    tanggal_lahir DATE,
    pekerjaan VARCHAR(100),
    keterangan TEXT,
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME,
    FOREIGN KEY (employee_id) REFERENCES karyawan(id)
  );
CREATE INDEX idx_keluarga_employee ON keluarga_karyawan(employee_id);
CREATE TABLE pendidikan_karyawan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    tingkat VARCHAR(30) NOT NULL,
    nama_sekolah VARCHAR(200) NOT NULL,
    jurusan VARCHAR(150),
    tahun_lulus INTEGER,
    keterangan TEXT,
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME,
    FOREIGN KEY (employee_id) REFERENCES karyawan(id)
  );
CREATE INDEX idx_pendidikan_employee ON pendidikan_karyawan(employee_id);
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    permissions TEXT NOT NULL DEFAULT '[]',
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME
  );
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role_id INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME, branch_scope VARCHAR(20) NOT NULL DEFAULT 'BRANCH',
    FOREIGN KEY (role_id) REFERENCES roles(id)
  );
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    status INTEGER NOT NULL DEFAULT 1,
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME
  );
CREATE TABLE branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    status INTEGER NOT NULL DEFAULT 1,
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );
CREATE TABLE positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(50),
    status INTEGER NOT NULL DEFAULT 1,
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    UNIQUE(department_id, code)
  );
CREATE TABLE employment_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME
  );
CREATE TABLE employee_positions (
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
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME,
    FOREIGN KEY (employee_id) REFERENCES karyawan(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (position_id) REFERENCES positions(id),
    FOREIGN KEY (employment_status_id) REFERENCES employment_statuses(id)
  );
CREATE TABLE employee_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    contract_no VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    document_path TEXT,
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME,
    FOREIGN KEY (employee_id) REFERENCES karyawan(id)
  );
CREATE TABLE user_activity_log (
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
CREATE TABLE data_change_history (
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
CREATE INDEX idx_activity_user ON user_activity_log(user_id);
CREATE INDEX idx_change_employee ON data_change_history(employee_id);
CREATE INDEX idx_change_table ON data_change_history(table_name, record_id);
CREATE INDEX idx_karyawan_branch ON karyawan(branch_id);
CREATE TABLE IF NOT EXISTS "departments" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(30) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        scope VARCHAR(20) NOT NULL DEFAULT 'BRANCH' CHECK(scope IN ('ALL', 'BRANCH')),
        status INTEGER NOT NULL DEFAULT 1,
        created_by VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(100),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_by VARCHAR(100),
        deleted_at DATETIME
      );
CREATE TABLE department_branches (
      department_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      PRIMARY KEY (department_id, branch_id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    );
CREATE TABLE shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    start_time VARCHAR(8) NOT NULL,
    end_time VARCHAR(8) NOT NULL,
    break_start VARCHAR(8),
    break_end VARCHAR(8),
    late_tolerance_minutes INTEGER NOT NULL DEFAULT 0,
    early_out_tolerance_minutes INTEGER NOT NULL DEFAULT 0,
    status INTEGER NOT NULL DEFAULT 1,
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME
  , color_bg VARCHAR(7), color_fg VARCHAR(7), color_border VARCHAR(7));
CREATE TABLE employee_shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    shift_id INTEGER NOT NULL,
    effective_from DATE,
    effective_to DATE,
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME, monthly_off_days INTEGER NOT NULL DEFAULT 4,
    FOREIGN KEY (employee_id) REFERENCES karyawan(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
  );
CREATE TABLE work_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    work_date DATE NOT NULL,
    shift_id INTEGER NOT NULL,
    start_time VARCHAR(8),
    end_time VARCHAR(8),
    status VARCHAR(20) NOT NULL DEFAULT 'WORK' CHECK(status IN ('WORK', 'OFF', 'LEAVE', 'HOLIDAY')),
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME,
    FOREIGN KEY (employee_id) REFERENCES karyawan(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id),
    UNIQUE(employee_id, work_date)
  );
CREATE TABLE attendances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    work_date DATE NOT NULL,
    schedule_id INTEGER,
    clock_in DATETIME,
    clock_out DATETIME,
    late_minutes INTEGER NOT NULL DEFAULT 0,
    early_out_minutes INTEGER NOT NULL DEFAULT 0,
    overtime_minutes INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PRESENT' CHECK(status IN ('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'OFF')),
    anomaly_flag INTEGER NOT NULL DEFAULT 0,
    anomaly_reason TEXT,
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(100),
    deleted_at DATETIME,
    FOREIGN KEY (employee_id) REFERENCES karyawan(id),
    FOREIGN KEY (schedule_id) REFERENCES work_schedules(id),
    UNIQUE(employee_id, work_date)
  );
CREATE INDEX idx_work_schedules_employee_date ON work_schedules(employee_id, work_date);
CREATE INDEX idx_attendances_employee_date ON attendances(employee_id, work_date);
CREATE INDEX idx_employee_shifts_employee ON employee_shifts(employee_id);
CREATE TABLE display_color_settings (
    key VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    group_key VARCHAR(30) NOT NULL,
    cell_code VARCHAR(10) NOT NULL,
    bg VARCHAR(7) NOT NULL,
    fg VARCHAR(7) NOT NULL,
    border VARCHAR(7),
    updated_by VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
CREATE TABLE user_branches (
      user_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, branch_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    );
