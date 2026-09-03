# Rencana Migrasi: VPS Ubuntu + PostgreSQL + ERP Core

Dokumen ini merencanakan migrasi **Absensi-Karyawan** dari SQLite lokal ke infrastruktur produksi:

- **VPS Ubuntu** — menjalankan API + frontend
- **PostgreSQL** — database utama (bukan D1/Cloudflare)
- **Schema `core`** — fondasi ERP multi-modul
- **Cloudflare** — hanya DNS + CDN + SSL proxy

Target domain (contoh): `absensi.goodis.web.id`, `payroll.goodis.web.id`, dll.

---

## Ringkasan arsitektur target

```
Internet
   │
   ▼
┌──────────────────────────────────────────┐
│  Cloudflare (DNS + CDN + WAF + SSL)      │
│  *.goodis.web.id → IP VPS                │
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│  VPS Ubuntu 24.04                        │
│  ┌────────────────────────────────────┐  │
│  │  Nginx (reverse proxy)             │  │
│  │  absensi.goodis.web.id → :3001     │  │
│  │  (nanti) payroll.goodis.web.id     │  │
│  └────────────────────────────────────┘  │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ Node.js API │  │ React static     │  │
│  │ (Express)   │  │ (frontend/dist)  │  │
│  │ PM2/systemd │  │                  │  │
│  └──────┬──────┘  └──────────────────┘  │
└─────────┼────────────────────────────────┘
          │
┌─────────▼────────────────────────────────┐
│  PostgreSQL 16                           │
│  Database: goodis_erp                    │
│  ├── schema core   (shared master data)  │
│  ├── schema hr     (absensi — app ini)   │
│  ├── schema payroll  (fase berikutnya)   │
│  ├── schema pos                          │
│  ├── schema inventory                    │
│  ├── schema accounting                   │
│  └── schema treasury  (kas)              │
└──────────────────────────────────────────┘
```

---

## Fase migrasi (overview)

| Fase | Fokus | Hasil |
|------|-------|-------|
| **0** | Persiapan | VPS, domain, rencana ini |
| **1** | Infrastruktur VPS | Ubuntu, PostgreSQL, Nginx, SSL |
| **2** | Schema `core` + `hr` | Database siap di PostgreSQL |
| **3** | Migrasi kode backend | `better-sqlite3` → `pg` |
| **4** | Migrasi data | SQLite → PostgreSQL |
| **5** | Deploy produksi | `absensi.goodis.web.id` live |
| **6** | Cloudflare DNS/CDN | Proxy + keamanan |
| **7** | Fondasi modul ERP | Placeholder schema modul lain |

---

## Fase 0 — Persiapan

### Checklist

- [ ] Sewa VPS (min. 2 vCPU, 4 GB RAM, 40 GB SSD) — contoh: DigitalOcean, Vultr, IDCloudHost, Niagahoster VPS
- [ ] Domain `goodis.web.id` (atau domain Anda) aktif di Cloudflare
- [ ] Akses SSH ke VPS (key-based, bukan password)
- [ ] Backup database SQLite saat ini: `backend/data/karyawan.db`
- [ ] Catat kredensial admin aplikasi (`admin`/`admin123`) — akan di-seed ulang di Postgres

### Spesifikasi VPS minimum

| Resource | Minimum | Disarankan (ERP penuh nanti) |
|----------|---------|------------------------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |
| OS | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |

---

## Fase 1 — Setup VPS Ubuntu + PostgreSQL

### 1.1 Initial server hardening

```bash
# Login sebagai root, buat user deploy
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Update sistem
sudo apt update && sudo apt upgrade -y

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 1.2 Install PostgreSQL 16

```bash
sudo apt install -y postgresql postgresql-contrib

# Buat database dan user aplikasi
sudo -u postgres psql <<'SQL'
CREATE USER goodis_app WITH PASSWORD 'GANTI_PASSWORD_KUAT';
CREATE DATABASE goodis_erp OWNER goodis_app;
GRANT ALL PRIVILEGES ON DATABASE goodis_erp TO goodis_app;
SQL

# Akses lokal saja (default) — app connect via localhost
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

### 1.3 Install Node.js 22 + PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx

sudo npm install -g pm2
```

### 1.4 Struktur direktori di VPS

```bash
sudo mkdir -p /var/www/goodis/{absensi,logs,releases}
sudo chown -R deploy:deploy /var/www/goodis
```

```
/var/www/goodis/
├── absensi/          # clone repo / release terbaru
│   ├── backend/
│   ├── frontend/dist/
│   └── .env
├── logs/
└── releases/         # (opsional) deploy bertahap
```

### 1.5 File environment produksi

Buat `/var/www/goodis/absensi/backend/.env`:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://goodis_app:PASSWORD@localhost:5432/goodis_erp
JWT_SECRET=GENERATE_DENGAN_openssl_rand_base64_32
CORS_ORIGIN=https://absensi.goodis.web.id
```

---

## Fase 2 — Rancang schema `core` (fondasi ERP)

### Prinsip desain

1. **Satu database** `goodis_erp`, banyak **schema** (namespace PostgreSQL)
2. **`core`** = data master bersama semua modul
3. **`hr`** = modul absensi/karyawan (app saat ini)
4. Modul masa depan punya schema sendiri, referensi ke `core`
5. Semua tabel pakai **audit columns** + **soft delete** (konsisten dengan app sekarang)

### Pemetaan tabel existing → schema baru

| Tabel SQLite (sekarang) | Schema PostgreSQL | Catatan |
|-------------------------|-------------------|---------|
| `companies` | `core.companies` | Tetap |
| `branches` | `core.branches` | Tetap |
| `departments` | `core.departments` | Tetap |
| `department_branches` | `core.department_branches` | Tetap |
| `positions` | `core.positions` | Tetap |
| `roles` | `core.roles` | + kolom `module` opsional |
| `users` | `core.users` | + `branch_scope` |
| `user_branches` | `core.user_branches` | Tetap |
| `user_activity_log` | `core.user_activity_log` | Shared audit |
| `data_change_history` | `core.data_change_history` | Shared audit |
| `karyawan` | `hr.employees` | Rename (view alias sementara) |
| `employment_statuses` | `hr.employment_statuses` | |
| `employee_positions` | `hr.employee_positions` | |
| `employee_contracts` | `hr.employee_contracts` | |
| `alamat_karyawan` | `hr.employee_addresses` | |
| `kontak_karyawan` | `hr.employee_contacts` | |
| `keluarga_karyawan` | `hr.employee_families` | |
| `pendidikan_karyawan` | `hr.employee_educations` | |
| `shifts` | `hr.shifts` | |
| `employee_shifts` | `hr.employee_shifts` | + `monthly_off_days` |
| `work_schedules` | `hr.work_schedules` | |
| `attendances` | `hr.attendances` | |
| `display_color_settings` | `hr.display_color_settings` | Spesifik modul HR |

### Tabel `core` baru (fondasi ERP)

| Tabel | Fungsi |
|-------|--------|
| `core.modules` | Registry modul: `hr`, `payroll`, `pos`, `inventory`, `accounting`, `treasury` |
| `core.fiscal_periods` | Periode buku (bulan/tahun) — dipakai accounting & payroll |
| `core.currencies` | Mata uang (IDR default) |
| `core.exchange_rates` | Kurs (opsional) |
| `core.chart_of_accounts` | Bagan akun — fondasi accounting |
| `core.settings` | Key-value config per company (`company_id`, `key`, `value`) |

### Schema placeholder modul depan

Buat schema kosong sekarang agar migrasi nanti tidak bentrok:

```sql
CREATE SCHEMA IF NOT EXISTS payroll;
CREATE SCHEMA IF NOT EXISTS pos;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS accounting;
CREATE SCHEMA IF NOT EXISTS treasury;
```

File SQL lengkap: **`database/postgres/001_schemas.sql`** dan **`database/postgres/002_core.sql`**, **`database/postgres/003_hr.sql`**

### Diagram relasi `core` (ringkas)

```
core.companies
    └── core.branches
            ├── core.department_branches ← core.departments
            ├── core.positions ← core.departments
            ├── core.user_branches ← core.users ← core.roles
            └── hr.employees (branch_id → core.branches)

hr.employees
    ├── hr.employee_positions → core.*
    ├── hr.work_schedules
    ├── hr.attendances
    └── hr.employee_shifts → hr.shifts
```

### SSO lintas subdomain (rencana)

Cookie domain: `.goodis.web.id`

```
Login di absensi.goodis.web.id
  → JWT disimpan + cookie domain=.goodis.web.id
  → payroll.goodis.web.id bisa validasi JWT yang sama
```

Implementasi: fase setelah modul payroll dibuat. Untuk fase 1, cukup single app `absensi`.

---

## Fase 3 — Migrasi kode backend ke PostgreSQL

### 3.1 Ganti database driver

| Dari | Ke |
|------|-----|
| `better-sqlite3` | `pg` (node-postgres) |
| Sync `db.prepare().get()` | Async `pool.query()` atau wrapper |

**Dependensi baru** (`backend/package.json`):

```json
{
  "dependencies": {
    "pg": "^8.13.0"
  }
}
```

Hapus: `better-sqlite3` (setelah migrasi selesai)

### 3.2 Buat layer database abstraction

Struktur file yang disarankan:

```
backend/src/db/
├── index.js          # export pool + helper
├── pool.js           # koneksi PostgreSQL dari DATABASE_URL
├── query.js          # wrapper: get, all, run, transaction
└── migrations/       # SQL files versioned (node-pg-migrate atau manual)
```

**Wrapper minimal** (kurangi perubahan di route):

```javascript
// Contoh pola — route jadi async
const row = await db.get('SELECT * FROM hr.employees WHERE id = $1', [id]);
const rows = await db.all('SELECT ...', [branchId]);
const result = await db.run('INSERT INTO ... RETURNING id', [...]);
```

### 3.3 Perubahan SQL yang diperlukan

| SQLite | PostgreSQL |
|--------|------------|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `BIGSERIAL PRIMARY KEY` |
| `DATETIME` | `TIMESTAMPTZ` atau `TIMESTAMP` |
| `INSERT OR IGNORE` | `INSERT ... ON CONFLICT DO NOTHING` |
| `?` placeholder | `$1, $2, $3` |
| `lastInsertRowid` | `RETURNING id` |
| `PRAGMA foreign_keys` | Sudah default ON |
| `db.transaction(() => {})` sync | `BEGIN; ... COMMIT` async / `pool.query('BEGIN')` |
| `strftime`, `date()` | `TO_CHAR`, `DATE_TRUNC` |

### 3.4 Urutan porting file backend

| Prioritas | File / area | Estimasi |
|-----------|-------------|----------|
| 1 | `db/`, `utils/audit.js` | Kecil |
| 2 | `middleware/auth.js` | Kecil |
| 3 | `routes/auth.js` | Kecil |
| 4 | `routes/companies.js`, `branches.js`, `departments.js` | Sedang |
| 5 | `routes/karyawan.js` + nested routes | Besar |
| 6 | `routes/employeeShifts.js`, `scheduleGenerator.js` | Sedang |
| 7 | `routes/attendanceGlobal.js`, `users.js`, `logs.js` | Sedang |
| 8 | `seed.js`, `seedDummyData.js` | Sedang |

### 3.5 Strategi kompatibilitas nama tabel

Agar frontend/API tidak breaking:

**Opsi A (disarankan):** rename ke `hr.employees` di DB, buat **view** untuk kompatibilitas sementara:

```sql
CREATE VIEW hr.karyawan AS SELECT * FROM hr.employees;
```

**Opsi B:** tetap nama `karyawan` di schema `hr` — lebih sedikit rename di kode.

Rekomendasi: **Opsi B untuk fase 1** (minimal breaking change), rename ke `employees` di fase refactor.

### 3.6 Environment development lokal

Tetap support SQLite untuk dev? **Tidak disarankan** — gunakan PostgreSQL lokal (Docker) agar parity dengan produksi:

```bash
docker run -d --name goodis-pg \
  -e POSTGRES_USER=goodis_app \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=goodis_erp \
  -p 5432:5432 postgres:16
```

---

## Fase 4 — Migrasi data SQLite → PostgreSQL

### 4.1 Urutan import (hormati foreign key)

```
1. core.roles
2. core.companies
3. core.branches
4. core.departments, core.department_branches
5. core.positions
6. core.users, core.user_branches
7. hr.employment_statuses
8. hr.karyawan (employees)
9. hr.employee_positions, contracts, alamat, kontak, keluarga, pendidikan
10. hr.shifts, hr.employee_shifts
11. hr.work_schedules, hr.attendances
12. hr.display_color_settings
13. core.user_activity_log, core.data_change_history
```

### 4.2 Script migrasi data

Buat `scripts/migrate-sqlite-to-postgres.mjs`:

1. Baca `backend/data/karyawan.db` via `better-sqlite3`
2. Connect ke PostgreSQL via `pg`
3. Insert per tabel dengan mapping schema
4. Reset sequence: `SELECT setval('hr.karyawan_id_seq', (SELECT MAX(id) FROM hr.karyawan));`

### 4.3 Validasi setelah migrasi

```sql
-- Hitung baris per tabel, bandingkan dengan SQLite
SELECT 'karyawan' AS t, COUNT(*) FROM hr.karyawan
UNION ALL SELECT 'attendances', COUNT(*) FROM hr.attendances
UNION ALL SELECT 'work_schedules', COUNT(*) FROM hr.work_schedules;
```

Checklist fungsional:

- [ ] Login `admin` / `admin123` berhasil
- [ ] List karyawan + filter cabang
- [ ] Grid jadwal kerja + kolom libur
- [ ] Grid kehadiran
- [ ] CRUD master data (cabang, departemen)
- [ ] Hak akses cabang user HR

---

## Fase 5 — Deploy aplikasi di VPS

### 5.1 Build & deploy

```bash
# Di VPS (sebagai deploy user)
cd /var/www/goodis/absensi
git pull origin main   # atau upload release

npm run install:all
cd frontend && npm run build
cd ../backend && npm install --production

# Apply migrasi DB
psql $DATABASE_URL -f database/postgres/001_schemas.sql
psql $DATABASE_URL -f database/postgres/002_core.sql
psql $DATABASE_URL -f database/postgres/003_hr.sql
node scripts/migrate-sqlite-to-postgres.mjs  # sekali saja

# Jalankan API
pm2 start backend/src/index.js --name goodis-absensi
pm2 save
pm2 startup
```

### 5.2 Nginx — `absensi.goodis.web.id`

```nginx
server {
    listen 80;
    server_name absensi.goodis.web.id;

    # Redirect ke HTTPS (setelah SSL aktif)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name absensi.goodis.web.id;

    # SSL — Cloudflare Full (strict) pakai origin cert atau Let's Encrypt
    ssl_certificate     /etc/ssl/certs/goodis.pem;
    ssl_certificate_key /etc/ssl/private/goodis.key;

    root /var/www/goodis/absensi/frontend/dist;
    index index.html;

    # API → Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/absensi.goodis.web.id /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5.3 SSL options

| Metode | Kapan dipakai |
|--------|---------------|
| **Cloudflare Origin Certificate** | SSL mode Full (strict) — disarankan |
| **Let's Encrypt (certbot)** | Jika origin tidak di belakang CF proxy |

---

## Fase 6 — Cloudflare (DNS + CDN saja)

### 6.1 DNS records

Di Cloudflare dashboard → DNS:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `absensi` | `<IP_VPS>` | Proxied (orange) |
| A | `payroll` | `<IP_VPS>` | Proxied (nanti) |
| A | `pos` | `<IP_VPS>` | Proxied (nanti) |

Wildcard (opsional): `*.goodis` → IP VPS

### 6.2 Pengaturan SSL/TLS

- Mode: **Full (strict)**
- Always Use HTTPS: **On**
- Minimum TLS: **1.2**

### 6.3 Pengaturan keamanan

- WAF: aktifkan managed rules (free tier)
- Bot Fight Mode: On
- Rate limiting: `/api/auth/login` (opsional, paid)

### 6.4 Yang TIDAK dipakai di Cloudflare

- ~~D1~~ — diganti PostgreSQL di VPS
- ~~Workers untuk API~~ — API di VPS
- ~~Pages untuk hosting~~ — Nginx serve static

---

## Fase 7 — Roadmap modul ERP berikutnya

Setelah `absensi.goodis.web.id` stabil:

| Urutan | Modul | Subdomain | Dependensi `core` |
|--------|-------|-----------|-------------------|
| 1 | HR / Absensi | `absensi.goodis.web.id` | ✅ (fase ini) |
| 2 | Payroll | `payroll.goodis.web.id` | employees, attendances, fiscal_periods |
| 3 | POS | `pos.goodis.web.id` | branches, chart_of_accounts |
| 4 | Inventory | `inventory.goodis.web.id` | branches, pos |
| 5 | Accounting | `accounting.goodis.web.id` | chart_of_accounts, fiscal_periods |
| 6 | Treasury (Kas) | `kas.goodis.web.id` | accounting, chart_of_accounts |

Setiap modul baru:

1. Schema PostgreSQL sendiri
2. App Node.js sendiri (atau monorepo modular)
3. Nginx server block subdomain baru
4. DNS A record di Cloudflare
5. RBAC permission di `core.roles`

---

## Backup & monitoring

### Backup PostgreSQL (harian)

```bash
# crontab -e (user deploy)
0 2 * * * pg_dump -U goodis_app goodis_erp | gzip > /var/backups/goodis_erp_$(date +\%Y\%m\%d).sql.gz
```

Simpan offsite: rsync ke storage lain atau Cloudflare R2 (hanya storage, bukan compute).

### Monitoring minimal

| Tool | Fungsi |
|------|--------|
| `pm2 monit` | Status proses Node |
| Uptime Kuma (self-host) | Cek `https://absensi.goodis.web.id/api/health` |
| `postgresql` logs | `/var/log/postgresql/` |

---

## Checklist go-live

### Infrastruktur
- [ ] VPS hardened (SSH key, UFW, user non-root)
- [ ] PostgreSQL running, user `goodis_app` dibuat
- [ ] Nginx configured + SSL
- [ ] PM2 auto-restart on boot
- [ ] Backup cron aktif

### Aplikasi
- [ ] Schema `core` + `hr` applied
- [ ] Data migrated & validated
- [ ] `JWT_SECRET` production (bukan default dev)
- [ ] `DATABASE_URL` di `.env` production
- [ ] Frontend build terbaru di `frontend/dist`

### Cloudflare
- [ ] DNS A record `absensi` → VPS IP (proxied)
- [ ] SSL Full (strict)
- [ ] HTTPS redirect aktif

### Fungsional
- [ ] Login/logout
- [ ] CRUD karyawan
- [ ] Jadwal + kehadiran
- [ ] Filter cabang + RBAC

---

## Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Data hilang saat migrasi | Backup SQLite + `pg_dump` sebelum cutover |
| Downtime | Deploy paralel, switch DNS setelah validasi |
| Query SQLite tidak kompatibel | Test suite + checklist fungsional |
| VPS down | Backup harian + dokumentasi restore |
| Single point of failure | (Fase lanjut) replica Postgres, load balancer |

---

## File terkait di repo

| File | Isi |
|------|-----|
| `database/postgres/001_schemas.sql` | Buat schema `core`, `hr`, dll. |
| `database/postgres/002_core.sql` | Tabel master ERP |
| `database/postgres/003_hr.sql` | Tabel modul absensi |
| `scripts/migrate-sqlite-to-postgres.mjs` | (akan dibuat) migrasi data |
| `docs/CLOUDFLARE-MIGRATION.md` | Rencana D1 — **tidak dipakai** untuk ERP ini |

---

## Langkah berikutnya (aksi)

1. **Anda:** Sewa VPS + pointing DNS `absensi` di Cloudflare
2. **Saya bisa kerjakan:** SQL schema PostgreSQL (`database/postgres/`)
3. **Saya bisa kerjakan:** Port backend `better-sqlite3` → `pg`
4. **Saya bisa kerjakan:** Script migrasi data SQLite → PostgreSQL
5. **Anda + saya:** Deploy & validasi go-live

Setelah VPS siap, berikan IP dan saya bisa lanjutkan implementasi kode migrasi.
