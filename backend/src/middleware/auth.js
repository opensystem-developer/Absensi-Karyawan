import jwt from 'jsonwebtoken';
import db from '../db.js';
import { attachBranchAccess } from '../utils/branchAccess.js';

const JWT_SECRET = process.env.JWT_SECRET || 'karyawan-dev-secret-change-in-production';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role_code, permissions: user.permissions },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function getUserWithRole(userId) {
  return db.prepare(`
    SELECT u.id, u.username, u.full_name, u.role_id, r.code as role_code, r.name as role_name, r.permissions
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ? AND u.is_active = 1 AND u.deleted_at IS NULL AND r.deleted_at IS NULL
  `).get(userId);
}

export function parsePermissions(permissionsJson) {
  try {
    return JSON.parse(permissionsJson || '[]');
  } catch {
    return [];
  }
}

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });

  try {
    const payload = verifyToken(token);
    const user = getUserWithRole(payload.id);
    if (!user) return res.status(401).json({ error: 'User tidak valid' });
    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role_code,
      permissions: parsePermissions(user.permissions),
    };
    attachBranchAccess(db, req);
    next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = verifyToken(token);
      const user = getUserWithRole(payload.id);
      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role_code,
          permissions: parsePermissions(user.permissions),
        };
        attachBranchAccess(db, req);
      }
    } catch { /* ignore */ }
  }
  next();
}

export function requirePermission(...perms) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.permissions.includes('*') || perms.some((p) => req.user.permissions.includes(p))) {
      return next();
    }
    return res.status(403).json({ error: 'Akses ditolak' });
  };
}

export function activityLogger(action, module) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400 && req.user) {
        import('../utils/logging.js').then(({ logActivity }) => {
          logActivity({
            userId: req.user.id,
            username: req.user.username,
            action,
            module,
            entityId: body?.id || req.params.id || null,
            description: `${action} ${module}`,
            ip: req.ip,
          });
        });
      }
      return originalJson(body);
    };
    next();
  };
}
