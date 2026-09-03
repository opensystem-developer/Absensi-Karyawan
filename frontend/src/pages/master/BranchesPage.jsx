import { useState, useEffect, useMemo } from 'react';
import CrudPage from '../../components/CrudPage';
import { branchesApi, companiesApi } from '../../api';

export default function BranchesPage() {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState('');

  useEffect(() => { companiesApi.list().then(setCompanies).catch(() => {}); }, []);

  const api = useMemo(() => ({
    ...branchesApi,
    list: () => branchesApi.list(companyId ? `company_id=${companyId}` : ''),
  }), [companyId]);

  return (
    <CrudPage
      key={companyId}
      title="Cabang"
      subtitle="Kelola data cabang/toko"
      api={api}
      columns={[
        { key: 'code', label: 'Kode' },
        { key: 'name', label: 'Nama' },
        { key: 'phone', label: 'Telepon' },
        { key: 'status', label: 'Status', type: 'boolean' },
      ]}
      fields={[
        { name: 'company_id', label: 'Perusahaan', type: 'select', required: true, options: companies.map((c) => ({ value: c.id, label: c.name })) },
        { name: 'code', label: 'Kode', required: true },
        { name: 'name', label: 'Nama Cabang', required: true },
        { name: 'address', label: 'Alamat', type: 'textarea', fullWidth: true },
        { name: 'phone', label: 'Telepon' },
        { name: 'status', label: 'Status', type: 'boolean', default: true },
      ]}
      filterBar={() => (
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
          <select className="filter-select" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">Semua Perusahaan</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
    />
  );
}
