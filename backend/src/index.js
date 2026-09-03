import express from 'express';
import cors from 'cors';
import karyawanRouter from './routes/karyawan.js';
import authRouter from './routes/auth.js';
import companiesRouter from './routes/companies.js';
import branchesRouter from './routes/branches.js';
import departmentsRouter from './routes/departments.js';
import positionsRouter from './routes/positions.js';
import employmentStatusesRouter from './routes/employmentStatuses.js';
import usersRouter from './routes/users.js';
import logsRouter from './routes/logs.js';
import displayColorsRouter from './routes/displayColors.js';
import shiftsRouter from './routes/shifts.js';
import { workSchedulesGlobalRouter, attendancesGlobalRouter } from './routes/attendanceGlobal.js';
import { authenticate, requirePermission } from './middleware/auth.js';
import db from './db.js';
import { getUserBranchesPayload } from './utils/branchAccess.js';
import { NOT_DELETED } from './utils/audit.js';
import './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'karyawan-api' });
});

app.use('/api/auth', authRouter);

app.use(authenticate);

app.get('/api/auth/me', (req, res) => {
  const branches = req.user.allBranches
    ? db.prepare(`SELECT id, code, name FROM branches WHERE ${NOT_DELETED} ORDER BY name`).all()
    : getUserBranchesPayload(db, req.user.id);
  res.json({
    user: {
      ...req.user,
      branches,
    },
  });
});

app.use('/api/karyawan', requirePermission('karyawan:read', 'karyawan:write', '*'), karyawanRouter);
app.use('/api/companies', requirePermission('master:read', 'master:write', 'org:read', 'org:write', '*'), companiesRouter);
app.use('/api/branches', requirePermission('master:read', 'master:write', 'org:read', 'org:write', '*'), branchesRouter);
app.use('/api/departments', requirePermission('master:read', 'master:write', 'org:read', 'org:write', '*'), departmentsRouter);
app.use('/api/positions', requirePermission('master:read', 'master:write', 'org:read', 'org:write', '*'), positionsRouter);
app.use('/api/employment-statuses', requirePermission('master:read', 'master:write', 'org:read', 'org:write', '*'), employmentStatusesRouter);
app.use(
  '/api/display-colors',
  requirePermission(
    'karyawan:read', 'karyawan:write', 'master:read', 'master:write', 'org:read', 'org:write', '*',
  ),
  displayColorsRouter,
);
app.use('/api/shifts', requirePermission('master:read', 'master:write', 'org:read', 'org:write', '*'), shiftsRouter);
app.use('/api/work-schedules', requirePermission('karyawan:read', 'karyawan:write', 'org:read', 'org:write', '*'), workSchedulesGlobalRouter);
app.use('/api/attendances', requirePermission('karyawan:read', 'karyawan:write', 'org:read', 'org:write', '*'), attendancesGlobalRouter);
app.use('/api/users', requirePermission('users:read', 'users:write', '*'), usersRouter);
app.use('/api/logs', requirePermission('logs:read', '*'), logsRouter);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
