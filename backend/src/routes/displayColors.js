import { Router } from 'express';
import db from '../db.js';
import { getUserId, handleDbError } from '../utils/audit.js';
import { getDisplayColorsPayload, updateDisplayColors } from '../utils/displayColors.js';
import { logActivity } from '../utils/logging.js';

const WRITE_PERMS = ['karyawan:write', 'master:write', 'org:write', '*'];

function requireColorWrite(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.permissions.includes('*') || WRITE_PERMS.some((p) => req.user.permissions.includes(p))) {
    return next();
  }
  return res.status(403).json({ error: 'Akses ditolak — butuh izin ubah data' });
}

const router = Router();

router.get('/', (req, res) => {
  try {
    res.json(getDisplayColorsPayload(db));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.put('/', requireColorWrite, (req, res) => {
  try {
    const userId = getUserId(req);
    const updated = updateDisplayColors(db, req.body, userId);
    logActivity({
      userId: req.user?.id,
      username: userId,
      action: 'UPDATE',
      module: 'display_colors',
      description: 'Ubah pengaturan warna jadwal/kehadiran',
      ip: req.ip,
    });
    res.json(updated);
  } catch (err) {
    handleDbError(err, res);
  }
});

export default router;
