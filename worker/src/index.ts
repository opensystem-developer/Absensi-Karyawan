/**
 * Cloudflare Worker entry — Express API + static React SPA.
 * Lihat docs/CLOUDFLARE-MIGRATION.md untuk langkah deploy penuh.
 */
import { env } from 'cloudflare:workers';
import { httpServerHandler } from 'cloudflare:node';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8787;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const row = await env.DB.prepare('SELECT 1 AS ok').first();
    res.json({
      status: 'ok',
      service: 'karyawan-api',
      runtime: 'cloudflare-workers',
      database: row ? 'connected' : 'unknown',
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      service: 'karyawan-api',
      runtime: 'cloudflare-workers',
      database: 'unavailable',
      hint: 'Jalankan migrasi D1: npx wrangler d1 migrations apply absensi-karyawan-db --remote',
    });
  }
});

// Placeholder — API penuh memerlukan porting layer DB ke D1 (async).
// Frontend sudah bisa di-deploy; endpoint lain menyusul di fase berikutnya.
app.all('/api/*', (req, res) => {
  if (req.path === '/api/health' || req.originalUrl === '/api/health') return;
  res.status(501).json({
    error: 'API endpoint belum dimigrasi ke Cloudflare Workers',
    path: req.originalUrl,
    message: 'Lihat docs/CLOUDFLARE-MIGRATION.md — Fase 3: porting API ke D1',
  });
});

app.listen(PORT);
export default httpServerHandler({ port: PORT });
