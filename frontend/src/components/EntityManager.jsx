import { useState, useEffect, useCallback } from 'react';

export default function EntityManager({
  employeeId,
  entityLabel,
  emptyForm,
  toFormData,
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  FormComponent,
  renderCard,
  addLabel,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFn(employeeId);
      setItems(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employeeId, fetchFn]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm(toFormData(item));
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError('');
  }

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      if (editingId) await updateFn(employeeId, editingId, form);
      else await createFn(employeeId, form);
      closeForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, label) {
    if (!confirm(`Hapus ${entityLabel} "${label}"?`)) return;
    try {
      await deleteFn(employeeId, id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (showForm) {
    return (
      <>
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }} onClick={closeForm}>
          &larr; Kembali ke Daftar
        </button>
        <FormComponent
          form={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          error={error}
          saving={saving}
          isEdit={!!editingId}
        />
      </>
    );
  }

  return (
    <>
      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={openCreate}>+ {addLabel}</button>
      </div>

      {loading ? (
        <div className="loading">Memuat data...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>Belum ada {entityLabel.toLowerCase()} terdaftar.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}>
            {addLabel} Pertama
          </button>
        </div>
      ) : (
        <div className="entity-list">
          {items.map((item) => (
            <div key={item.id} className="entity-card">
              {renderCard(item)}
              <div className="actions" style={{ marginTop: '0.75rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id, item.nama || item.type || item.tingkat)}>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
