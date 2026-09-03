import bcrypt from 'bcryptjs';
import { seedDummyData } from './seedDummyData.js';

const ALL_PERMISSIONS = ['*', 'karyawan:read', 'karyawan:write', 'master:read', 'master:write', 'org:read', 'org:write', 'users:read', 'users:write', 'logs:read'];

export function seedDatabase(db) {
  const roleCount = db.prepare('SELECT COUNT(*) as c FROM roles').get().c;
  if (roleCount > 0) return;

  const insertRole = db.prepare('INSERT INTO roles (code, name, permissions, created_by, updated_by) VALUES (?, ?, ?, ?, ?)');

  const adminId = insertRole.run('admin', 'Administrator', JSON.stringify(['*']), 'system', 'system').lastInsertRowid;
  const hrId = insertRole.run('hr', 'HR Staff', JSON.stringify(['karyawan:read', 'karyawan:write', 'master:read', 'master:write', 'org:read', 'org:write', 'logs:read']), 'system', 'system').lastInsertRowid;
  insertRole.run('viewer', 'Viewer', JSON.stringify(['karyawan:read', 'master:read', 'org:read', 'logs:read']), 'system', 'system');

  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role_id, is_active, created_by, updated_by)
    VALUES (?, ?, ?, ?, 1, 'system', 'system')
  `).run('admin', hash, 'Administrator', adminId);

  db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role_id, is_active, created_by, updated_by)
    VALUES (?, ?, ?, ?, 1, 'system', 'system')
  `).run('hr', bcrypt.hashSync('hr123', 10), 'Staff HR', hrId);

  const statuses = [
    ['PERMANENT', 'Karyawan Tetap'],
    ['CONTRACT', 'Kontrak'],
    ['DAILY', 'Harian'],
    ['PART_TIME', 'Paruh Waktu'],
    ['INTERN', 'Magang'],
  ];
  const insStatus = db.prepare('INSERT INTO employment_statuses (code, name, created_by, updated_by) VALUES (?, ?, ?, ?)');
  for (const [code, name] of statuses) insStatus.run(code, name, 'system', 'system');

  const companyId = db.prepare(`
    INSERT INTO companies (code, name, status, created_by, updated_by) VALUES ('CMP001', 'PT Contoh Perusahaan', 1, 'system', 'system')
  `).run().lastInsertRowid;

  const branchId = db.prepare(`
    INSERT INTO branches (company_id, code, name, address, phone, status, created_by, updated_by)
    VALUES (?, 'OFFICE', 'Kantor Pusat', 'Jakarta', '021-1234567', 1, 'system', 'system')
  `).run(companyId).lastInsertRowid;

  const deptId = db.prepare(`
    INSERT INTO departments (code, name, scope, status, created_by, updated_by)
    VALUES ('IT', 'Teknologi Informasi', 'BRANCH', 1, 'system', 'system')
  `).run().lastInsertRowid;

  db.prepare('INSERT INTO department_branches (department_id, branch_id) VALUES (?, ?)').run(deptId, branchId);

  db.prepare(`
    INSERT INTO departments (code, name, scope, status, created_by, updated_by)
    VALUES ('HR', 'Human Resources', 'BRANCH', 1, 'system', 'system')
  `).run();

  db.prepare(`
    INSERT INTO departments (code, name, scope, status, created_by, updated_by)
    VALUES ('FIN', 'Keuangan', 'BRANCH', 1, 'system', 'system')
  `).run();

  db.prepare(`
    INSERT INTO departments (code, name, scope, status, created_by, updated_by)
    VALUES ('KASIR', 'Kasir', 'BRANCH', 1, 'system', 'system')
  `).run();

  const hrDept = db.prepare('SELECT id FROM departments WHERE code = ?').get('HR');
  const finDept = db.prepare('SELECT id FROM departments WHERE code = ?').get('FIN');
  const kasirDept = db.prepare('SELECT id FROM departments WHERE code = ?').get('KASIR');
  db.prepare('INSERT INTO department_branches (department_id, branch_id) VALUES (?, ?)').run(hrDept.id, branchId);
  db.prepare('INSERT INTO department_branches (department_id, branch_id) VALUES (?, ?)').run(finDept.id, branchId);
  db.prepare('INSERT INTO department_branches (department_id, branch_id) VALUES (?, ?)').run(kasirDept.id, branchId);

  seedDummyData(db);
}

export { ALL_PERMISSIONS };
