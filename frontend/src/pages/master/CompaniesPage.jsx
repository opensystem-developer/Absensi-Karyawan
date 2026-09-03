import CrudPage from '../../components/CrudPage';
import { companiesApi } from '../../api';

export default function CompaniesPage() {
  return (
    <CrudPage
      title="Perusahaan"
      subtitle="Kelola data perusahaan"
      api={companiesApi}
      columns={[
        { key: 'code', label: 'Kode' },
        { key: 'name', label: 'Nama' },
        { key: 'status', label: 'Status', type: 'boolean' },
      ]}
      fields={[
        { name: 'code', label: 'Kode', required: true },
        { name: 'name', label: 'Nama Perusahaan', required: true },
        { name: 'status', label: 'Status', type: 'boolean', default: true },
      ]}
    />
  );
}
