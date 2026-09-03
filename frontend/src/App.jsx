import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import PanelLayout from './layout/PanelLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KaryawanPage from './pages/KaryawanPage';
import PekerjaanKaryawanPage from './pages/PekerjaanKaryawanPage';
import CompaniesPage from './pages/master/CompaniesPage';
import BranchesPage from './pages/master/BranchesPage';
import DepartmentsPage from './pages/master/DepartmentsPage';
import PositionsPage from './pages/master/PositionsPage';
import EmploymentStatusesPage from './pages/master/EmploymentStatusesPage';
import ShiftsPage from './pages/master/ShiftsPage';
import WorkSchedulesPage from './pages/WorkSchedulesPage';
import AttendancesPage from './pages/AttendancesPage';
import UsersPage from './pages/UsersPage';
import ActivityLogPage from './pages/ActivityLogPage';
import ChangeHistoryPage from './pages/ChangeHistoryPage';

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute><PanelLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="karyawan" element={<ProtectedRoute permission="karyawan:read"><KaryawanPage /></ProtectedRoute>} />
        <Route path="pekerjaan-karyawan" element={<ProtectedRoute permission="karyawan:read"><PekerjaanKaryawanPage /></ProtectedRoute>} />
        <Route path="perusahaan" element={<ProtectedRoute permission="master:read"><CompaniesPage /></ProtectedRoute>} />
        <Route path="cabang" element={<ProtectedRoute permission="org:read"><BranchesPage /></ProtectedRoute>} />
        <Route path="departemen" element={<ProtectedRoute permission="org:read"><DepartmentsPage /></ProtectedRoute>} />
        <Route path="jabatan" element={<ProtectedRoute permission="org:read"><PositionsPage /></ProtectedRoute>} />
        <Route path="status-karyawan" element={<ProtectedRoute permission="master:read"><EmploymentStatusesPage /></ProtectedRoute>} />
        <Route path="shift" element={<ProtectedRoute permission="master:read"><ShiftsPage /></ProtectedRoute>} />
        <Route path="jadwal-kerja" element={<ProtectedRoute permission="karyawan:read"><WorkSchedulesPage /></ProtectedRoute>} />
        <Route path="kehadiran" element={<ProtectedRoute permission="karyawan:read"><AttendancesPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute permission="users:read"><UsersPage /></ProtectedRoute>} />
        <Route path="activity-log" element={<ProtectedRoute permission="logs:read"><ActivityLogPage /></ProtectedRoute>} />
        <Route path="change-history" element={<ProtectedRoute permission="logs:read"><ChangeHistoryPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
