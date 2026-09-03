# Manajemen Karyawan

Aplikasi web untuk mengelola data karyawan perusahaan.

## Fitur

- CRUD data karyawan lengkap (identitas, dokumen, kepegawaian)
- CRUD alamat, kontak, keluarga, dan pendidikan per karyawan
- Soft delete dengan audit trail (created/updated/deleted by & at)
- Format tanggal tampilan: dd/mm/yyyy
- Pencarian berdasarkan nama, nomor karyawan, atau NIK
- Filter berdasarkan status karyawan (Aktif, Nonaktif, Resign, PHK)
- Validasi data unik untuk nomor karyawan dan NIK

## Struktur Data

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | BIGINT PK | Primary key internal |
| employee_no | VARCHAR(30) UNIQUE | Nomor karyawan |
| nik | VARCHAR(20) UNIQUE | NIK KTP |
| nama_lengkap | VARCHAR(150) | Nama lengkap |
| nama_panggilan | VARCHAR(50) | Nama panggilan |
| jenis_kelamin | ENUM('L','P') | Laki-laki / Perempuan |
| tempat_lahir | VARCHAR(100) | Tempat lahir |
| tanggal_lahir | DATE | Tanggal lahir |
| agama | VARCHAR(30) | Agama |
| status_pernikahan | VARCHAR(30) | Status pernikahan |
| jumlah_anak | INT | Jumlah anak |
| no_kk | VARCHAR(20) | Nomor KK |
| npwp | VARCHAR(30) | NPWP |
| no_bpjs_kesehatan | VARCHAR(30) | BPJS Kesehatan |
| no_bpjs_tk | VARCHAR(30) | BPJS Ketenagakerjaan |
| tanggal_masuk | DATE | Tanggal mulai bekerja |
| tanggal_keluar | DATE | Tanggal keluar |
| status_karyawan | VARCHAR(30) | Aktif / Nonaktif / Resign / PHK |
| alasan_keluar | TEXT | Alasan keluar |
| keterangan | TEXT | Catatan umum |

### Field Audit (semua tabel)

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| created_by | VARCHAR(100) | User pembuat |
| created_at | DATETIME | Waktu dibuat |
| updated_by | VARCHAR(100) | User pengubah terakhir |
| updated_at | DATETIME | Waktu diubah terakhir |
| deleted_by | VARCHAR(100) | User penghapus |
| deleted_at | DATETIME | Waktu dihapus (soft delete) |

### Alamat Karyawan

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | BIGINT PK | Primary key |
| employee_id | BIGINT FK | Referensi ke karyawan.id |
| type | VARCHAR(20) | KTP / DOMISILI |
| alamat | TEXT | Alamat lengkap |
| rt | VARCHAR(10) | RT |
| rw | VARCHAR(10) | RW |
| kelurahan | VARCHAR(100) | Kelurahan |
| kecamatan | VARCHAR(100) | Kecamatan |
| kota | VARCHAR(100) | Kota/Kabupaten |
| provinsi | VARCHAR(100) | Provinsi |
| kode_pos | VARCHAR(10) | Kode pos |
| is_primary | BOOLEAN | Alamat utama |

### Kontak Karyawan

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | BIGINT PK | Primary key |
| employee_id | BIGINT FK | Referensi ke karyawan.id |
| type | VARCHAR(30) | PERSONAL / EMERGENCY |
| nama | VARCHAR(150) | Nama kontak |
| hubungan | VARCHAR(50) | Hubungan dengan karyawan |
| nomor_telepon | VARCHAR(30) | Nomor telepon |
| is_primary | BOOLEAN | Kontak utama |
| keterangan | TEXT | Catatan |

### Keluarga Karyawan

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | BIGINT PK | Primary key |
| employee_id | BIGINT FK | Referensi ke karyawan.id |
| nama | VARCHAR(150) | Nama anggota keluarga |
| hubungan | VARCHAR(50) | Istri / Suami / Anak / dll |
| jenis_kelamin | ENUM('L','P') | Jenis kelamin |
| tanggal_lahir | DATE | Tanggal lahir |
| pekerjaan | VARCHAR(100) | Pekerjaan |
| keterangan | TEXT | Catatan |

### Pendidikan Karyawan

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | BIGINT PK | Primary key |
| employee_id | BIGINT FK | Referensi ke karyawan.id |
| tingkat | VARCHAR(30) | SD/SMP/SMA/D3/S1/S2/dll |
| nama_sekolah | VARCHAR(200) | Nama sekolah/universitas |
| jurusan | VARCHAR(150) | Jurusan |
| tahun_lulus | YEAR | Tahun lulus |
| keterangan | TEXT | Catatan |

## Tech Stack

- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Frontend**: React, Vite

## Menjalankan Aplikasi

### Backend

```bash
cd backend
npm install
npm run dev
```

API berjalan di `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikasi web berjalan di `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/karyawan` | Daftar karyawan (query: `search`, `status`) |
| GET | `/api/karyawan/:id` | Detail karyawan |
| POST | `/api/karyawan` | Tambah karyawan baru |
| PUT | `/api/karyawan/:id` | Perbarui data karyawan |
| DELETE | `/api/karyawan/:id` | Hapus karyawan |
| GET | `/api/karyawan/:employeeId/alamat` | Daftar alamat karyawan |
| POST | `/api/karyawan/:employeeId/alamat` | Tambah alamat |
| PUT | `/api/karyawan/:employeeId/alamat/:id` | Update alamat |
| DELETE | `/api/karyawan/:employeeId/alamat/:id` | Hapus alamat (soft delete) |
| GET | `/api/karyawan/:employeeId/kontak` | Daftar kontak karyawan |
| POST | `/api/karyawan/:employeeId/kontak` | Tambah kontak |
| PUT | `/api/karyawan/:employeeId/kontak/:id` | Update kontak |
| DELETE | `/api/karyawan/:employeeId/kontak/:id` | Hapus kontak |
| GET | `/api/karyawan/:employeeId/keluarga` | Daftar keluarga karyawan |
| POST | `/api/karyawan/:employeeId/keluarga` | Tambah keluarga |
| PUT | `/api/karyawan/:employeeId/keluarga/:id` | Update keluarga |
| DELETE | `/api/karyawan/:employeeId/keluarga/:id` | Hapus keluarga |
| GET | `/api/karyawan/:employeeId/pendidikan` | Daftar pendidikan karyawan |
| POST | `/api/karyawan/:employeeId/pendidikan` | Tambah pendidikan |
| PUT | `/api/karyawan/:employeeId/pendidikan/:id` | Update pendidikan |
| DELETE | `/api/karyawan/:employeeId/pendidikan/:id` | Hapus pendidikan |

> Header `X-User-Id` digunakan untuk audit trail (created_by, updated_by, deleted_by).

## Deploy ke Cloudflare

Aplikasi ini sudah disiapkan untuk migrasi ke **Cloudflare Workers + D1**.

Panduan lengkap: **[docs/CLOUDFLARE-MIGRATION.md](docs/CLOUDFLARE-MIGRATION.md)**

Ringkasan cepat:

```bash
npx wrangler login
npx wrangler d1 create absensi-karyawan-db   # salin database_id ke wrangler.jsonc
npm run cf:migrate                            # apply schema ke D1
npm run cf:export-data                        # export data SQLite lokal
npx wrangler secret put JWT_SECRET
npm run cf:deploy
```

**Status:** Frontend + `/api/health` siap deploy. Porting API penuh ke D1 (async) masih dalam progres — lihat panduan untuk opsi hybrid sementara.

> **Catatan:** Untuk visi ERP multi-modul (`*.goodis.web.id`), gunakan rencana **VPS + PostgreSQL** di [docs/MIGRATION-VPS-POSTGRES.md](docs/MIGRATION-VPS-POSTGRES.md) — bukan Cloudflare D1.
