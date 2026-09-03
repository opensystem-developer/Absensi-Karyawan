import { NOT_DELETED } from './audit.js';

export const SCOPE_ALL = 'ALL';
export const SCOPE_BRANCH = 'BRANCH';

export function getDepartmentBranchIds(db, departmentId) {
  return db.prepare(`
    SELECT branch_id FROM department_branches WHERE department_id = ?
  `).all(departmentId).map((r) => r.branch_id);
}

export function setDepartmentBranches(db, departmentId, branchIds = []) {
  db.prepare('DELETE FROM department_branches WHERE department_id = ?').run(departmentId);
  const ins = db.prepare('INSERT INTO department_branches (department_id, branch_id) VALUES (?, ?)');
  for (const branchId of branchIds) {
    ins.run(departmentId, branchId);
  }
}

export function enrichDepartment(db, row) {
  if (!row) return row;
  const branchIds = getDepartmentBranchIds(db, row.id);
  const branchNames = branchIds.length
    ? db.prepare(`
        SELECT name FROM branches
        WHERE id IN (${branchIds.map(() => '?').join(',')}) AND ${NOT_DELETED}
        ORDER BY name
      `).all(...branchIds).map((b) => b.name)
    : [];
  return {
    ...row,
    status: !!row.status,
    scope: row.scope || SCOPE_BRANCH,
    scope_label: (row.scope || SCOPE_BRANCH) === SCOPE_ALL ? 'Semua Cabang' : 'Cabang Tertentu',
    branch_ids: branchIds,
    branch_names: (row.scope || SCOPE_BRANCH) === SCOPE_ALL ? 'Semua cabang' : branchNames.join(', ') || '-',
  };
}

export function listDepartments(db, { branchId } = {}) {
  let sql = 'SELECT d.* FROM departments d WHERE d.deleted_at IS NULL';
  const params = [];

  if (branchId) {
    sql += `
      AND (
        d.scope = ?
        OR EXISTS (
          SELECT 1 FROM department_branches db
          WHERE db.department_id = d.id AND db.branch_id = ?
        )
      )
    `;
    params.push(SCOPE_ALL, branchId);
  }

  sql += ' ORDER BY d.name ASC';
  return db.prepare(sql).all(...params).map((row) => enrichDepartment(db, row));
}

export function validateDepartmentInput(data, isUpdate = false) {
  const scope = data.scope || SCOPE_BRANCH;
  if (!['ALL', 'BRANCH'].includes(scope)) return 'Scope tidak valid';
  if (!data.code?.trim()) return 'Kode wajib diisi';
  if (!data.name?.trim()) return 'Nama wajib diisi';
  if (scope === SCOPE_BRANCH) {
    const ids = Array.isArray(data.branch_ids) ? data.branch_ids : [];
    if (ids.length === 0) return 'Pilih minimal satu cabang untuk departemen spesifik';
  }
  return null;
}

export function normalizeDepartmentInput(body) {
  const scope = body.scope === SCOPE_ALL ? SCOPE_ALL : SCOPE_BRANCH;
  const branchIds = Array.isArray(body.branch_ids)
    ? [...new Set(body.branch_ids.map((id) => parseInt(id, 10)).filter(Boolean))]
    : body.branch_id
      ? [parseInt(body.branch_id, 10)].filter(Boolean)
      : [];

  return {
    code: String(body.code || '').trim(),
    name: String(body.name || '').trim(),
    scope,
    status: body.status === undefined || body.status === '' ? 1 : (body.status ? 1 : 0),
    branch_ids: scope === SCOPE_ALL ? [] : branchIds,
  };
}
