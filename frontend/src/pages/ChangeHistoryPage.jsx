import { useState, useEffect } from 'react';
import { fetchChangeHistory } from '../api';
import { formatDateTime, formatMaybeDate } from '../constants';

export default function ChangeHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('karyawan');

  useEffect(() => {
    setLoading(true);
    const q = tableFilter ? `table_name=${tableFilter}&limit=200` : 'limit=200';
    fetchChangeHistory(q).then(setLogs).catch(console.error).finally(() => setLoading(false));
  }, [tableFilter]);

  return (
    <div className="page">
      <div className="page-header"><h1>Riwayat Perubahan</h1><p>Lacak perubahan data terutama karyawan</p></div>
      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <select className="filter-select" value={tableFilter} onChange={(e) => setTableFilter(e.target.value)}>
          <option value="karyawan">Karyawan</option>
          <option value="companies">Perusahaan</option>
          <option value="branches">Cabang</option>
          <option value="">Semua Tabel</option>
        </select>
      </div>
      <div className="card">
        {loading ? <div className="loading">Memuat...</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Waktu</th><th>Tabel</th><th>ID</th><th>Aksi</th><th>Field</th><th>Nilai Lama</th><th>Nilai Baru</th><th>Oleh</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{formatDateTime(l.changed_at)}</td>
                    <td>{l.table_name}</td>
                    <td>{l.record_id}</td>
                    <td>{l.action}</td>
                    <td>{l.field_name || '-'}</td>
                    <td className="cell-truncate">{formatMaybeDate(l.old_value)}</td>
                    <td className="cell-truncate">{formatMaybeDate(l.new_value)}</td>
                    <td>{l.changed_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
