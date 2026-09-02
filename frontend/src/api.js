const API_BASE = '/api/karyawan';

export async function fetchKaryawan(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  const url = query.toString() ? `${API_BASE}?${query}` : API_BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat data karyawan');
  return res.json();
}

export async function fetchKaryawanById(id) {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error('Karyawan tidak ditemukan');
  return res.json();
}

export async function createKaryawan(data) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Gagal menambah karyawan');
  return json;
}

export async function updateKaryawan(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Gagal memperbarui karyawan');
  return json;
}

export async function deleteKaryawan(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Gagal menghapus karyawan');
  return json;
}
