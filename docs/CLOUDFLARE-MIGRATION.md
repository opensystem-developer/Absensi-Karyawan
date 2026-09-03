# Migrasi Absensi-Karyawan ke Cloudflare

Panduan ini menjelaskan cara memindahkan aplikasi HR System (React + Express + SQLite) ke **Cloudflare Workers + D1 + Static Assets**.

## Arsitektur target

```
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Workers (absensi-karyawan)                  │
│  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │  Static Assets  │  │  Express API (/api/*)       │ │
│  │  React SPA      │  │  + D1 Database binding      │ │
│  │  (frontend/dist)│  │  nodejs_compat_v2           │ │
│  └─────────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

| Komponen lama | Komponen Cloudflare |
|---------------|---------------------|
| Vite dev server (port 5173) | **Workers Assets** (`frontend/dist`) |
| Express API (port 3001) | **Workers** + Express (`httpServerHandler`) |
| SQLite file (`karyawan.db`) | **D1** (SQLite serverless) |
| `JWT_SECRET` env | **Wrangler Secret** |

---

## Status migrasi saat ini

| Fase | Status | Keterangan |
|------|--------|------------|
| 1. Scaffold Cloudflare | ✅ Selesai | `wrangler.jsonc`, worker entry, migrations |
| 2. Schema D1 | ✅ Selesai | `migrations/0001_schema.sql` |
| 3. Export data | ✅ Script siap | `scripts/export-sqlite-to-d1.mjs` |
| 4. Deploy frontend | ✅ Siap | SPA + `/api/health` |
| 5. Porting API penuh | ⏳ Belum | Perlu ubah `better-sqlite3` → D1 async |

**Yang sudah bisa di-deploy sekarang:** frontend React + endpoint `/api/health`.

**Yang masih perlu dikerjakan:** semua endpoint API (`/api/karyawan`, `/api/auth/login`, dll.) — karena backend saat ini memakai `better-sqlite3` (sinkron, native Node) yang tidak bisa jalan di Workers.

---

## Langkah yang perlu Anda kerjakan

### 1. Akun & login Cloudflare

1. Buat akun di [cloudflare.com](https://dash.cloudflare.com/sign-up) (gratis tier cukup untuk mulai).
2. Install Wrangler (sudah tersedia di project):
   ```bash
   npm install
   ```
3. Login:
   ```bash
   npx wrangler login
   ```

### 2. Buat database D1

```bash
npx wrangler d1 create absensi-karyawan-db
```

Salin `database_id` dari output, lalu edit `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "absensi-karyawan-db",
    "database_id": "PASTE_DATABASE_ID_DISINI",
    "migrations_dir": "migrations"
  }
]
```

### 3. Jalankan migrasi schema ke D1

**Lokal (untuk dev):**
```bash
npx wrangler d1 migrations apply absensi-karyawan-db --local
```

**Production (remote):**
```bash
npx wrangler d1 migrations apply absensi-karyawan-db --remote
```

### 4. Export & import data dari SQLite lokal

Jika Anda sudah punya data di `backend/data/karyawan.db`:

```bash
# Generate file INSERT
npm run cf:export-data

# Import ke D1 production
npx wrangler d1 execute absensi-karyawan-db --remote --file=migrations/0002_data.sql
```

> **Catatan:** Urutan tabel di file data mengikuti abjad. Jika ada error foreign key, import per tabel atau sesuaikan urutan (roles → users → companies → branches → ...).

### 5. Set secret JWT

```bash
npx wrangler secret put JWT_SECRET
# Masukkan string acak yang kuat (min. 32 karakter)
```

Generate secret:
```bash
openssl rand -base64 32
```

### 6. Build frontend & deploy

```bash
npm run cf:deploy
```

Setelah deploy, Wrangler menampilkan URL seperti:
`https://absensi-karyawan.<subdomain>.workers.dev`

### 7. (Opsional) Custom domain

1. Dashboard Cloudflare → **Workers & Pages** → pilih worker `absensi-karyawan`
2. **Settings** → **Domains & Routes** → **Add Custom Domain**
3. Ikuti wizard DNS (otomatis jika domain sudah di Cloudflare)

---

## Perintah npm yang tersedia

| Perintah | Fungsi |
|----------|--------|
| `npm run build:cf` | Build frontend (`frontend/dist`) |
| `npm run cf:dev` | Build + `wrangler dev` (lokal port 8787) |
| `npm run cf:deploy` | Build + deploy ke Cloudflare |
| `npm run cf:migrate` | Apply migrasi D1 ke remote |
| `npm run cf:export-data` | Export data SQLite → `migrations/0002_data.sql` |

---

## Fase berikutnya: porting API ke D1

Ini bagian terbesar migrasi. Backend saat ini (~30 file) memakai pola sinkron:

```javascript
const row = db.prepare('SELECT ...').get(id);  // sync — tidak jalan di Workers
```

Di Cloudflare Workers + D1, semua query harus **async**:

```javascript
const row = await env.DB.prepare('SELECT ...').bind(id).first();
```

### Opsi A — Port bertahap (disarankan)

1. Buat adapter D1 async (`backend/src/db/d1Adapter.js`)
2. Ubah route per modul menjadi `async (req, res) => { await ... }`
3. Mulai dari: `auth` → `karyawan` → master data → jadwal/kehadiran
4. Express di Workers sudah didukung resmi ([tutorial Express + D1](https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/))

### Opsi B — Deploy hybrid sementara

1. Deploy **frontend saja** ke Cloudflare Workers (sudah siap)
2. API tetap di server/VPS lama
3. Ubah `frontend/src/api.js`: `const API = 'https://api.domain-anda.com/api'`
4. Set CORS di backend lama
5. Port API ke D1 secara bertahap

### Opsi C — Cloudflare Tunnel (tanpa ubah backend)

Jika ingin domain Cloudflare tapi backend Node tetap di VPS:

1. Install `cloudflared` di server
2. Buat tunnel ke `localhost:3001`
3. Frontend di Pages/Workers, API via tunnel

---

## Struktur file Cloudflare di repo

```
/workspace/
├── wrangler.jsonc          # Konfigurasi Worker + D1 + Assets
├── worker/
│   └── src/index.ts        # Entry Express di Workers
├── migrations/
│   ├── 0001_schema.sql   # Schema D1
│   └── 0002_data.sql       # Data (generated)
├── scripts/
│   └── export-sqlite-to-d1.mjs
└── docs/
    └── CLOUDFLARE-MIGRATION.md  # File ini
```

---

## Troubleshooting

### `database_id` invalid
Pastikan sudah `wrangler d1 create` dan ID di `wrangler.jsonc` benar.

### `/api/health` → database unavailable
Jalankan migrasi D1: `npm run cf:migrate`

### Endpoint lain → 501 Not Implemented
Normal — API belum di-port ke D1. Lihat **Fase berikutnya** di atas.

### Build frontend gagal
```bash
cd frontend && npm install && npm run build
```

### Data import gagal (foreign key)
Import bertahap per tabel atau matikan FK sementara:
```sql
PRAGMA foreign_keys = OFF;
-- INSERT ...
PRAGMA foreign_keys = ON;
```

---

## Estimasi kompleksitas

| Area | Tingkat | Catatan |
|------|---------|---------|
| Frontend deploy | Rendah | Sudah siap, tidak perlu ubah kode |
| D1 schema + data | Rendah | Script sudah ada |
| Auth + JWT | Rendah | bcryptjs + jose kompatibel Workers |
| CRUD master data | Sedang | ~10 route files, ubah ke async |
| Karyawan + nested | Tinggi | Banyak nested routes + joins |
| Jadwal generator | Sedang | Logic bisa di-reuse, DB calls async |

---

## Referensi

- [Deploy Express on Workers](https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/)
- [D1 Get Started](https://developers.cloudflare.com/d1/get-started/)
- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
