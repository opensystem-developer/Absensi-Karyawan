import { useState, useEffect } from 'react';
import { fetchActivityLog } from '../api';
import { formatDateTime } from '../constants';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLog('limit=200').then(setLogs).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header"><h1>Log Aktivitas</h1><p>Riwayat aktivitas pengguna sistem</p></div>
      <div className="card">
        {loading ? <div className="loading">Memuat...</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Waktu</th><th>User</th><th>Aksi</th><th>Modul</th><th>Deskripsi</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{formatDateTime(l.created_at)}</td>
                    <td>{l.username}</td>
                    <td><span className="badge badge-type-ktp">{l.action}</span></td>
                    <td>{l.module}</td>
                    <td>{l.description}</td>
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
