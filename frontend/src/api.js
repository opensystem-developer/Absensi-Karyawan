const API_BASE = '/api/karyawan';
const CURRENT_USER = 'admin';

function headers() {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': CURRENT_USER,
  };
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...headers(), ...options.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Terjadi kesalahan');
  return json;
}

export async function fetchKaryawan(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  const url = query.toString() ? `${API_BASE}?${query}` : API_BASE;
  return request(url);
}

export async function fetchKaryawanById(id) {
  return request(`${API_BASE}/${id}`);
}

export async function createKaryawan(data) {
  return request(API_BASE, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateKaryawan(id, data) {
  return request(`${API_BASE}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteKaryawan(id) {
  return request(`${API_BASE}/${id}`, { method: 'DELETE' });
}

function resourceApi(resource) {
  const base = (employeeId) => `${API_BASE}/${employeeId}/${resource}`;
  return {
    fetch: (employeeId) => request(base(employeeId)),
    create: (employeeId, data) => request(base(employeeId), { method: 'POST', body: JSON.stringify(data) }),
    update: (employeeId, id, data) => request(`${base(employeeId)}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (employeeId, id) => request(`${base(employeeId)}/${id}`, { method: 'DELETE' }),
  };
}

const alamat = resourceApi('alamat');
const kontak = resourceApi('kontak');
const keluarga = resourceApi('keluarga');
const pendidikan = resourceApi('pendidikan');

export const fetchAlamat = alamat.fetch;
export const createAlamat = alamat.create;
export const updateAlamat = alamat.update;
export const deleteAlamat = alamat.delete;

export const fetchKontak = kontak.fetch;
export const createKontak = kontak.create;
export const updateKontak = kontak.update;
export const deleteKontak = kontak.delete;

export const fetchKeluarga = keluarga.fetch;
export const createKeluarga = keluarga.create;
export const updateKeluarga = keluarga.update;
export const deleteKeluarga = keluarga.delete;

export const fetchPendidikan = pendidikan.fetch;
export const createPendidikan = pendidikan.create;
export const updatePendidikan = pendidikan.update;
export const deletePendidikan = pendidikan.delete;
