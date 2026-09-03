import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENU = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/karyawan', label: 'Karyawan', icon: '👥', perm: 'karyawan:read' },
  { section: 'Master Data' },
  { to: '/perusahaan', label: 'Perusahaan', icon: '🏢', perm: 'master:read' },
  { to: '/cabang', label: 'Cabang', icon: '🏪', perm: 'org:read' },
  { to: '/departemen', label: 'Departemen', icon: '🏬', perm: 'org:read' },
  { to: '/jabatan', label: 'Jabatan', icon: '💼', perm: 'org:read' },
  { to: '/status-karyawan', label: 'Status Karyawan', icon: '📋', perm: 'master:read' },
  { to: '/shift', label: 'Shift', icon: '⏰', perm: 'master:read' },
  { section: 'Absensi' },
  { to: '/jadwal-kerja', label: 'Jadwal Kerja', icon: '📅', perm: 'karyawan:read' },
  { to: '/kehadiran', label: 'Kehadiran', icon: '✅', perm: 'karyawan:read' },
  { section: 'Sistem' },
  { to: '/users', label: 'Pengguna', icon: '🔐', perm: 'users:read' },
  { to: '/activity-log', label: 'Log Aktivitas', icon: '📝', perm: 'logs:read' },
  { to: '/change-history', label: 'Riwayat Perubahan', icon: '🕐', perm: 'logs:read' },
];

export default function PanelLayout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="panel-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>HR System</h2>
          <p>Manajemen Karyawan</p>
        </div>
        <nav className="sidebar-nav">
          {MENU.map((item, i) => {
            if (item.section) return <div key={i} className="nav-section">{item.section}</div>;
            if (item.perm && !hasPermission(item.perm, '*')) return null;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <strong>{user?.fullName}</strong>
            <span>{user?.roleName || user?.role}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Keluar</button>
        </div>
      </aside>
      <div className="panel-main">
        <Outlet />
      </div>
    </div>
  );
}
