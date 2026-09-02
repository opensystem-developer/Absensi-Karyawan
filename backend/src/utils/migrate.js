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

export function runMigrations(db) {
  const tables = [
    'roles', 'users', 'companies', 'branches', 'departments', 'positions',
    'employment_statuses', 'karyawan', 'employee_positions', 'employee_contracts',
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
}
