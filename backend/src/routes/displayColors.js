import { Router } from 'express';
import db from '../db.js';
import { getUserId, handleDbError } from '../utils/audit.js';
import { getDisplayColorsPayload, updateDisplayColors } from '../utils/displayColors.js';
import { logActivity } from '../utils/logging.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    res.json(getDisplayColorsPayload(db));
  } catch (err) {
    handleDbError(err, res);
  }
});

router.put('/', (req, res) => {
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
