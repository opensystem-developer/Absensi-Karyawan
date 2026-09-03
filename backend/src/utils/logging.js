import db from '../db.js';
import { now } from './audit.js';

export function logActivity({ userId, username, action, module, entityId, description, ip }) {
  db.prepare(`
    INSERT INTO user_activity_log (user_id, username, action, module, entity_id, description, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId || null, username || 'system', action, module, entityId || null, description || null, ip || null, now());
}

export function logDataChanges({ tableName, recordId, employeeId, action, changes, changedBy }) {
  const stmt = db.prepare(`
    INSERT INTO data_change_history (table_name, record_id, employee_id, action, field_name, old_value, new_value, changed_by, changed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const ts = now();
  const insert = db.transaction(() => {
    if (!changes || changes.length === 0) {
      stmt.run(tableName, recordId, employeeId || null, action, null, null, null, changedBy, ts);
      return;
    }
    for (const c of changes) {
      stmt.run(tableName, recordId, employeeId || null, action, c.field, c.oldValue ?? null, c.newValue ?? null, changedBy, ts);
    }
  });
  insert();
}

export function diffRecords(oldRow, newRow, fields) {
  const changes = [];
  for (const field of fields) {
    const oldVal = oldRow[field] ?? null;
    const newVal = newRow[field] ?? null;
    if (String(oldVal) !== String(newVal)) {
      changes.push({ field, oldValue: oldVal, newValue: newVal });
    }
  }
  return changes;
}
