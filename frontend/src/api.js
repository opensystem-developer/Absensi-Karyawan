const API = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function request(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...headers(), ...options.headers } });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!url.includes('/auth/login')) window.location.href = '/login';
  }
  if (!res.ok) throw new Error(json.error || 'Terjadi kesalahan');
  return json;
}

export async function login(username, password) {
  return request(`${API}/auth/login`, { method: 'POST', body: JSON.stringify({ username, password }) });
}

export async function fetchMe() {
  return request(`${API}/auth/me`);
}

function crud(base) {
  return {
    list: (query = '') => request(`${base}${query ? `?${query}` : ''}`),
    get: (id) => request(`${base}/${id}`),
    create: (data) => request(base, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`${base}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`${base}/${id}`, { method: 'DELETE' }),
  };
}

export async function fetchKaryawanSetupStatus() {
  return request(`${API}/karyawan/setup-status`);
}

export async function previewEmployeeNo(branchId, tanggalMasuk = '') {
  const q = new URLSearchParams({ branch_id: branchId });
  if (tanggalMasuk) q.set('tanggal_masuk', tanggalMasuk);
  return request(`${API}/karyawan/preview-employee-no?${q}`);
}

export const karyawanApi = crud(`${API}/karyawan`);
export const companiesApi = crud(`${API}/companies`);
export const branchesApi = crud(`${API}/branches`);
export const departmentsApi = crud(`${API}/departments`);
export const positionsApi = crud(`${API}/positions`);
export const employmentStatusesApi = crud(`${API}/employment-statuses`);
export const usersApi = crud(`${API}/users`);

export async function fetchRoles() {
  return request(`${API}/users/roles`);
}

export async function fetchActivityLog(params = '') {
  return request(`${API}/logs/activity${params ? `?${params}` : ''}`);
}

export async function fetchChangeHistory(params = '') {
  return request(`${API}/logs/changes${params ? `?${params}` : ''}`);
}

export async function fetchKaryawanChanges(id) {
  return request(`${API}/logs/changes/karyawan/${id}`);
}

const nested = (resource) => ({
  list: (employeeId) => request(`${API}/karyawan/${employeeId}/${resource}`),
  create: (employeeId, data) => request(`${API}/karyawan/${employeeId}/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (employeeId, id, data) => request(`${API}/karyawan/${employeeId}/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (employeeId, id) => request(`${API}/karyawan/${employeeId}/${resource}/${id}`, { method: 'DELETE' }),
});

export const alamatApi = nested('alamat');
export const kontakApi = nested('kontak');
export const keluargaApi = nested('keluarga');
export const pendidikanApi = nested('pendidikan');
export const posisiApi = nested('posisi');
export const kontrakApi = nested('kontrak');

// Backward compat exports
export const fetchKaryawan = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return karyawanApi.list(q);
};
export const createKaryawan = karyawanApi.create;
export const updateKaryawan = karyawanApi.update;
export const deleteKaryawan = karyawanApi.delete;
export const fetchAlamat = alamatApi.list;
export const createAlamat = alamatApi.create;
export const updateAlamat = alamatApi.update;
export const deleteAlamat = alamatApi.delete;
export const fetchKontak = kontakApi.list;
export const createKontak = kontakApi.create;
export const updateKontak = kontakApi.update;
export const deleteKontak = kontakApi.delete;
export const fetchKeluarga = keluargaApi.list;
export const createKeluarga = keluargaApi.create;
export const updateKeluarga = keluargaApi.update;
export const deleteKeluarga = keluargaApi.delete;
export const fetchPendidikan = pendidikanApi.list;
export const createPendidikan = pendidikanApi.create;
export const updatePendidikan = pendidikanApi.update;
export const deletePendidikan = pendidikanApi.delete;
export const fetchPosisi = posisiApi.list;
export const createPosisi = posisiApi.create;
export const updatePosisi = posisiApi.update;
export const deletePosisi = posisiApi.delete;
export const fetchKontrak = kontrakApi.list;
export const createKontrak = kontrakApi.create;
export const updateKontrak = kontrakApi.update;
export const deleteKontrak = kontrakApi.delete;
