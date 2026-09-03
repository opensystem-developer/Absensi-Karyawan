import { NOT_DELETED } from './audit.js';

export function userHasAllBranches(user) {
  if (!user) return false;
  if (user.permissions?.includes('*')) return true;
  return user.branchScope === 'ALL';
}

export function getUserBranchIds(db, userId) {
  return db.prepare(`
    SELECT branch_id FROM user_branches WHERE user_id = ?
  `).all(userId).map((r) => r.branch_id);
}

export function loadBranchAccess(db, user) {
  if (!user?.id) return { allBranches: false, branchIds: [], branchScope: 'BRANCH' };

  const row = db.prepare(`
    SELECT branch_scope FROM users WHERE id = ? AND ${NOT_DELETED}
  `).get(user.id);
  const branchScope = row?.branch_scope || 'BRANCH';

  if (user.permissions?.includes('*') || branchScope === 'ALL') {
    const all = db.prepare(`SELECT id FROM branches WHERE ${NOT_DELETED}`).all();
    return { allBranches: true, branchIds: all.map((b) => b.id), branchScope: 'ALL' };
  }

  const branchIds = getUserBranchIds(db, user.id);
  return { allBranches: false, branchIds, branchScope };
}

export function attachBranchAccess(db, req) {
  if (!req.user) return;
  const access = loadBranchAccess(db, req.user);
  req.user.branchScope = access.branchScope;
  req.user.allBranches = access.allBranches;
  req.user.branchIds = access.branchIds;
}

export function resolveBranchFilter(req, requestedBranchId) {
  const access = req.user?.branchIds || [];
  const allBranches = req.user?.allBranches;

  if (requestedBranchId) {
    const id = parseInt(requestedBranchId, 10);
    if (!allBranches && !access.includes(id)) {
      return { error: 'Akses cabang ditolak', branchIds: [] };
    }
    return { branchIds: [id], filterId: id };
  }

  if (allBranches) {
    return { branchIds: null, filterId: null };
  }

  return { branchIds: access, filterId: null };
}

export function branchSqlInClause(branchIds, column = 'k.branch_id') {
  if (branchIds === null) return { sql: '', params: [] };
  if (!branchIds?.length) return { sql: ` AND 1 = 0`, params: [] };
  return {
    sql: ` AND ${column} IN (${branchIds.map(() => '?').join(',')})`,
    params: branchIds,
  };
}

export function assertEmployeeBranchAccess(db, req, employeeId) {
  const employee = db.prepare(`
    SELECT k.id, k.branch_id FROM karyawan k
    WHERE k.id = ? AND k.deleted_at IS NULL
  `).get(employeeId);
  if (!employee) return { ok: false, status: 404, error: 'Karyawan tidak ditemukan' };

  if (req.user?.allBranches) return { ok: true, employee };

  const branchId = employee.branch_id;
  if (!branchId || !req.user?.branchIds?.includes(branchId)) {
    return { ok: false, status: 403, error: 'Akses cabang ditolak' };
  }
  return { ok: true, employee };
}

export function saveUserBranches(db, userId, branchIds = []) {
  db.prepare('DELETE FROM user_branches WHERE user_id = ?').run(userId);
  const ins = db.prepare('INSERT INTO user_branches (user_id, branch_id) VALUES (?, ?)');
  for (const branchId of branchIds) {
    ins.run(userId, parseInt(branchId, 10));
  }
}

export function getUserBranchesPayload(db, userId) {
  return db.prepare(`
    SELECT b.id, b.code, b.name
    FROM user_branches ub
    JOIN branches b ON b.id = ub.branch_id AND b.deleted_at IS NULL
    WHERE ub.user_id = ?
    ORDER BY b.name
  `).all(userId);
}
