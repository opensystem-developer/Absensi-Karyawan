-- Goodis ERP — core schema (master data + auth + audit)
-- Jalankan setelah 001_schemas.sql

-- ─── Module registry ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core.modules (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(30) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  subdomain   VARCHAR(100),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO core.modules (code, name, subdomain) VALUES
  ('hr',         'HR & Absensi',  'absensi'),
  ('payroll',    'Payroll',       'payroll'),
  ('pos',        'Point of Sale', 'pos'),
  ('inventory',  'Inventory',     'inventory'),
  ('accounting', 'Accounting',    'accounting'),
  ('treasury',   'Kas & Bank',    'kas')
ON CONFLICT (code) DO NOTHING;

-- ─── Currencies ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core.currencies (
  code        CHAR(3) PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  symbol      VARCHAR(10) NOT NULL DEFAULT 'Rp',
  is_default  BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO core.currencies (code, name, symbol, is_default) VALUES
  ('IDR', 'Rupiah Indonesia', 'Rp', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ─── Companies & branches ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core.companies (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(30) NOT NULL UNIQUE,
  name        VARCHAR(150) NOT NULL,
  status      SMALLINT NOT NULL DEFAULT 1,
  created_by  VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  VARCHAR(100),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by  VARCHAR(100),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS core.branches (
  id          BIGSERIAL PRIMARY KEY,
  company_id  BIGINT NOT NULL REFERENCES core.companies(id),
  code        VARCHAR(30) NOT NULL UNIQUE,
  name        VARCHAR(150) NOT NULL,
  address     TEXT,
  phone       VARCHAR(30),
  status      SMALLINT NOT NULL DEFAULT 1,
  created_by  VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  VARCHAR(100),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by  VARCHAR(100),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_branches_company ON core.branches(company_id);

-- ─── Org structure ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core.departments (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(30) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  scope       VARCHAR(20) NOT NULL DEFAULT 'BRANCH' CHECK (scope IN ('ALL', 'BRANCH')),
  status      SMALLINT NOT NULL DEFAULT 1,
  created_by  VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  VARCHAR(100),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by  VARCHAR(100),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS core.department_branches (
  department_id BIGINT NOT NULL REFERENCES core.departments(id),
  branch_id     BIGINT NOT NULL REFERENCES core.branches(id),
  PRIMARY KEY (department_id, branch_id)
);

CREATE TABLE IF NOT EXISTS core.positions (
  id            BIGSERIAL PRIMARY KEY,
  department_id BIGINT NOT NULL REFERENCES core.departments(id),
  code          VARCHAR(30) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  level         VARCHAR(50),
  status        SMALLINT NOT NULL DEFAULT 1,
  created_by    VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    VARCHAR(100),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by    VARCHAR(100),
  deleted_at    TIMESTAMPTZ,
  UNIQUE (department_id, code)
);

-- ─── Auth & RBAC ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core.roles (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(30) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]',
  module      VARCHAR(30) REFERENCES core.modules(code),
  created_by  VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  VARCHAR(100),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by  VARCHAR(100),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS core.users (
  id            BIGSERIAL PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     VARCHAR(150) NOT NULL,
  role_id       BIGINT NOT NULL REFERENCES core.roles(id),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  branch_scope  VARCHAR(20) NOT NULL DEFAULT 'BRANCH' CHECK (branch_scope IN ('ALL', 'BRANCH')),
  created_by    VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    VARCHAR(100),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by    VARCHAR(100),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS core.user_branches (
  user_id   BIGINT NOT NULL REFERENCES core.users(id),
  branch_id BIGINT NOT NULL REFERENCES core.branches(id),
  PRIMARY KEY (user_id, branch_id)
);

-- ─── Fiscal & accounting foundation ───────────────────────────────
CREATE TABLE IF NOT EXISTS core.fiscal_periods (
  id          BIGSERIAL PRIMARY KEY,
  company_id  BIGINT NOT NULL REFERENCES core.companies(id),
  year        SMALLINT NOT NULL,
  month       SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  status      VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  closed_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, year, month)
);

CREATE TABLE IF NOT EXISTS core.chart_of_accounts (
  id          BIGSERIAL PRIMARY KEY,
  company_id  BIGINT NOT NULL REFERENCES core.companies(id),
  code        VARCHAR(30) NOT NULL,
  name        VARCHAR(150) NOT NULL,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  parent_id   BIGINT REFERENCES core.chart_of_accounts(id),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS core.settings (
  id          BIGSERIAL PRIMARY KEY,
  company_id  BIGINT REFERENCES core.companies(id),
  key         VARCHAR(100) NOT NULL,
  value       JSONB NOT NULL DEFAULT '{}',
  updated_by  VARCHAR(100),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, key)
);

-- ─── Shared audit logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core.user_activity_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT,
  username    VARCHAR(50),
  action      VARCHAR(50) NOT NULL,
  module      VARCHAR(50),
  entity_id   BIGINT,
  description TEXT,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON core.user_activity_log(user_id);

CREATE TABLE IF NOT EXISTS core.data_change_history (
  id          BIGSERIAL PRIMARY KEY,
  table_name  VARCHAR(50) NOT NULL,
  record_id   BIGINT NOT NULL,
  employee_id BIGINT,
  action      VARCHAR(20) NOT NULL,
  field_name  VARCHAR(100),
  old_value   TEXT,
  new_value   TEXT,
  changed_by  VARCHAR(100),
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_employee ON core.data_change_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_change_table ON core.data_change_history(table_name, record_id);
