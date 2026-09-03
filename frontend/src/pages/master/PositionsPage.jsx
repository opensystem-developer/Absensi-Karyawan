import { useState, useEffect, useMemo } from 'react';
import CrudPage from '../../components/CrudPage';
import { positionsApi, departmentsApi } from '../../api';

export default function PositionsPage() {
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');

  useEffect(() => { departmentsApi.list().then(setDepartments).catch(() => {}); }, []);

  const api = useMemo(() => ({
    ...positionsApi,
    list: () => positionsApi.list(departmentId ? `department_id=${departmentId}` : ''),
  }), [departmentId]);

  return (
    <CrudPage
      key={departmentId}
      title="Jabatan"
      api={api}
      columns={[
        { key: 'code', label: 'Kode' },
        { key: 'name', label: 'Nama' },
        { key: 'level', label: 'Level' },
        { key: 'status', label: 'Status', type: 'boolean' },
      ]}
      fields={[
        { name: 'department_id', label: 'Departemen', type: 'select', required: true, options: departments.map((d) => ({ value: d.id, label: d.name })) },
        { name: 'code', label: 'Kode', required: true },
        { name: 'name', label: 'Nama Jabatan', required: true },
        { name: 'level', label: 'Level' },
        { name: 'status', label: 'Status', type: 'boolean', default: true },
      ]}
      filterBar={() => (
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
          <select className="filter-select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">Semua Departemen</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      )}
    />
  );
}
