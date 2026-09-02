import express from 'express';
import cors from 'cors';
import karyawanRouter from './routes/karyawan.js';
import './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'karyawan-api' });
});

app.use('/api/karyawan', karyawanRouter);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
