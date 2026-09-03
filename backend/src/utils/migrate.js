import { seedDisplayColorSettings } from './displayColors.js';
import { ensureShiftDefaultColors } from './colorUtils.js';

const AUDIT_COLUMNS = [
  ['created_by', 'VARCHAR(100)'],
  ['updated_by', 'VARCHAR(100)'],
  ['deleted_by', 'VARCHAR(100)'],
  ['deleted_at', 'DATETIME'],
];

function hasColumn(db, table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some((c) => c.name === column);
}

function addColumn(db, table, column, definition) {
  if (!hasColumn(db, table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function tableExists(db, name) {
  return !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name);
}

function recreateDepartmentBranches(db) {
  if (tableExists(db, 'department_branches')) db.exec('DROP TABLE department_branches');
  db.exec(`
    CREATE TABLE department_branches (
      department_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      PRIMARY KEY (department_id, branch_id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    );
  `);
}

export function runMigrations(db) {
  const tables = [
    'roles', 'users', 'companies', 'branches', 'departments', 'positions',
    'employment_statuses', 'shifts', 'employee_shifts', 'work_schedules', 'attendances',
    'karyawan', 'employee_positions', 'employee_contracts',
    'alamat_karyawan', 'kontak_karyawan', 'keluarga_karyawan', 'pendidikan_karyawan',
  ];
  for (const table of tables) {
    if (!hasColumn(db, table, 'id')) continue;
    if (!hasColumn(db, table, 'created_at')) addColumn(db, table, 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    if (!hasColumn(db, table, 'updated_at')) addColumn(db, table, 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    for (const [col, def] of AUDIT_COLUMNS) addColumn(db, table, col, def);
  }
  addColumn(db, 'karyawan', 'branch_id', 'INTEGER REFERENCES branches(id)');
  if (hasColumn(db, 'karyawan', 'branch_id')) {
    db.exec('CREATE INDEX IF NOT EXISTS idx_karyawan_branch ON karyawan(branch_id)');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS department_branches (
      department_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      PRIMARY KEY (department_id, branch_id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    );
  `);

  addColumn(db, 'departments', 'scope', "VARCHAR(20) NOT NULL DEFAULT 'BRANCH'");

  if (hasColumn(db, 'departments', 'branch_id')) {
    const branchLinks = [];
    if (tableExists(db, 'department_branches')) {
      branchLinks.push(...db.prepare('SELECT department_id, branch_id FROM department_branches').all());
    } else {
      branchLinks.push(...db.prepare('SELECT id AS department_id, branch_id FROM departments WHERE branch_id IS NOT NULL').all());
    }

    db.pragma('foreign_keys = OFF');

    if (!tableExists(db, 'departments_migrated')) {
      db.exec("UPDATE departments SET scope = 'BRANCH' WHERE scope IS NULL OR scope = ''");
      db.exec(`
        CREATE TABLE departments_migrated (
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
      `);

      const rows = db.prepare('SELECT * FROM departments ORDER BY id').all();
      const seenCodes = new Set();
      for (const row of rows) {
        let code = row.code;
        if (seenCodes.has(code)) code = `${code}-B${row.branch_id}`;
        seenCodes.add(code);

        db.prepare(`
          INSERT INTO departments_migrated (id, code, name, scope, status, created_by, created_at, updated_by, updated_at, deleted_by, deleted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          row.id, code, row.name, row.scope || 'BRANCH', row.status,
          row.created_by, row.created_at, row.updated_by, row.updated_at, row.deleted_by, row.deleted_at,
        );
      }
    }

    if (tableExists(db, 'department_branches')) db.exec('DROP TABLE department_branches');
    if (tableExists(db, 'departments')) db.exec('DROP TABLE departments');
    db.exec('ALTER TABLE departments_migrated RENAME TO departments');
    recreateDepartmentBranches(db);

    const restore = db.prepare('INSERT OR IGNORE INTO department_branches (department_id, branch_id) VALUES (?, ?)');
    for (const link of branchLinks) restore.run(link.department_id, link.branch_id);

    db.pragma('foreign_keys = ON');
  } else if (!tableExists(db, 'department_branches')) {
    recreateDepartmentBranches(db);
  }

  addColumn(db, 'shifts', 'color_bg', 'VARCHAR(7)');
  addColumn(db, 'shifts', 'color_fg', 'VARCHAR(7)');
  addColumn(db, 'shifts', 'color_border', 'VARCHAR(7)');

  if (!tableExists(db, 'display_color_settings')) {
    db.exec(`
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
    `);
  }

  seedDisplayColorSettings(db);
  ensureShiftDefaultColors(db);
}
