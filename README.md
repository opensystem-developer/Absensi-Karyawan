# Manajemen Karyawan

Aplikasi web untuk mengelola data karyawan perusahaan.

## Fitur

- CRUD data karyawan lengkap (identitas, dokumen, kepegawaian)
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
| created_at | DATETIME | Waktu dibuat |
| updated_at | DATETIME | Waktu terakhir diubah |

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
| DELETE | `/api/karyawan/:employeeId/alamat/:id` | Hapus alamat |
