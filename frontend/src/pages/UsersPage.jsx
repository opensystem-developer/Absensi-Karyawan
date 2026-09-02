import { useState, useEffect } from 'react';
import CrudPage from '../components/CrudPage';
import { usersApi, fetchRoles } from '../api';

export default function UsersPage() {
  const [roles, setRoles] = useState([]);
  useEffect(() => { fetchRoles().then(setRoles).catch(() => {}); }, []);

  return (
    <CrudPage
      title="Pengguna"
      subtitle="Kelola user dan RBAC"
      api={usersApi}
      columns={[
        { key: 'username', label: 'Username' },
        { key: 'full_name', label: 'Nama' },
        { key: 'role_name', label: 'Role' },
        { key: 'is_active', label: 'Status', type: 'boolean' },
      ]}
      fields={[
        { name: 'username', label: 'Username', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
        { name: 'full_name', label: 'Nama Lengkap', required: true },
        { name: 'role_id', label: 'Role', type: 'select', required: true, options: roles.map((r) => ({ value: r.id, label: r.name })) },
        { name: 'is_active', label: 'Status', type: 'boolean', default: true },
      ]}
    />
  );
}
