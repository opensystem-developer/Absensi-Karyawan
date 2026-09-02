import { useState, useEffect, useMemo } from 'react';
import CrudPage from '../../components/CrudPage';
import { departmentsApi, branchesApi } from '../../api';

export default function DepartmentsPage() {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');

  useEffect(() => { branchesApi.list().then(setBranches).catch(() => {}); }, []);

  const api = useMemo(() => ({
    ...departmentsApi,
    list: () => departmentsApi.list(branchId ? `branch_id=${branchId}` : ''),
  }), [branchId]);

  return (
    <CrudPage
      key={branchId}
      title="Departemen"
      api={api}
      columns={[
        { key: 'code', label: 'Kode' },
        { key: 'name', label: 'Nama' },
        { key: 'status', label: 'Status', type: 'boolean' },
      ]}
      fields={[
        { name: 'branch_id', label: 'Cabang', type: 'select', required: true, options: branches.map((b) => ({ value: b.id, label: b.name })) },
        { name: 'code', label: 'Kode', required: true },
        { name: 'name', label: 'Nama Departemen', required: true },
        { name: 'status', label: 'Status', type: 'boolean', default: true },
      ]}
      filterBar={() => (
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
          <select className="filter-select" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Semua Cabang</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
    />
  );
}
