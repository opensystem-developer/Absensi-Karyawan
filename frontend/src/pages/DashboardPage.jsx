import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Selamat datang, {user?.fullName}</p>
      </div>
      <div className="dashboard-cards">
        <div className="dash-card">
          <h3>Manajemen Karyawan</h3>
          <p>Kelola data karyawan, alamat, kontak, keluarga, pendidikan, posisi, dan kontrak.</p>
        </div>
        <div className="dash-card">
          <h3>Master Data</h3>
          <p>Perusahaan, cabang, departemen, jabatan, dan status karyawan.</p>
        </div>
        <div className="dash-card">
          <h3>Audit & Log</h3>
          <p>Lacak aktivitas pengguna dan riwayat perubahan data karyawan.</p>
        </div>
      </div>
    </div>
  );
}
