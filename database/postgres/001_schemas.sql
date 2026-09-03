-- Goodis ERP — PostgreSQL schemas
-- Jalankan: psql $DATABASE_URL -f database/postgres/001_schemas.sql

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS payroll;
CREATE SCHEMA IF NOT EXISTS pos;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS accounting;
CREATE SCHEMA IF NOT EXISTS treasury;

COMMENT ON SCHEMA core IS 'Master data & auth — shared across all ERP modules';
COMMENT ON SCHEMA hr IS 'HR, karyawan, absensi, jadwal kerja';
COMMENT ON SCHEMA payroll IS 'Payroll — fase berikutnya';
COMMENT ON SCHEMA pos IS 'Point of Sale — fase berikutnya';
COMMENT ON SCHEMA inventory IS 'Inventory & stok — fase berikutnya';
COMMENT ON SCHEMA accounting IS 'Akuntansi & jurnal — fase berikutnya';
COMMENT ON SCHEMA treasury IS 'Kas & bank — fase berikutnya';

-- Default search path untuk session aplikasi (set di connection string atau SET search_path)
-- SET search_path TO hr, core, public;
