import CrudPage from '../../components/CrudPage';
import { employmentStatusesApi } from '../../api';

export default function EmploymentStatusesPage() {
  return (
    <CrudPage
      title="Status Karyawan"
      subtitle="PERMANENT, CONTRACT, DAILY, PART_TIME, INTERN"
      api={employmentStatusesApi}
      columns={[
        { key: 'code', label: 'Kode' },
        { key: 'name', label: 'Nama' },
      ]}
      fields={[
        { name: 'code', label: 'Kode', required: true },
        { name: 'name', label: 'Nama Status', required: true },
      ]}
    />
  );
}
