import { Router } from 'express';
import db from '../db.js';
import { NOT_DELETED } from '../utils/audit.js';

const router = Router();

router.get('/activity', (req, res) => {
  try {
    const { user_id, module, limit = 100 } = req.query;
    let sql = 'SELECT * FROM user_activity_log WHERE 1=1';
    const params = [];
    if (user_id) { sql += ' AND user_id = ?'; params.push(user_id); }
    if (module) { sql += ' AND module = ?'; params.push(module); }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10) || 100);
    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/changes', (req, res) => {
  try {
    const { employee_id, table_name, limit = 100 } = req.query;
    let sql = 'SELECT * FROM data_change_history WHERE 1=1';
    const params = [];
    if (employee_id) { sql += ' AND employee_id = ?'; params.push(employee_id); }
    if (table_name) { sql += ' AND table_name = ?'; params.push(table_name); }
    sql += ' ORDER BY changed_at DESC LIMIT ?';
    params.push(parseInt(limit, 10) || 100);
    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/changes/karyawan/:id', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM data_change_history
      WHERE employee_id = ? OR (table_name = 'karyawan' AND record_id = ?)
      ORDER BY changed_at DESC LIMIT 200
    `).all(req.params.id, req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

export default router;
