import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken, parsePermissions } from '../middleware/auth.js';
import { logActivity } from '../utils/logging.js';

const router = Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi' });

    const user = db.prepare(`
      SELECT u.*, r.code as role_code, r.name as role_name, r.permissions
      FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.username = ? AND u.is_active = 1 AND u.deleted_at IS NULL
    `).get(username);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const permissions = parsePermissions(user.permissions);
    const token = signToken({ id: user.id, username: user.username, role_code: user.role_code, permissions });
    logActivity({ userId: user.id, username: user.username, action: 'LOGIN', module: 'auth', description: 'User login', ip: req.ip });

    res.json({
      token,
      user: { id: user.id, username: user.username, fullName: user.full_name, role: user.role_code, roleName: user.role_name, permissions },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

export default router;
