import { useState } from 'react';
import { createLink } from '../api';

export default function AddLinkModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ slug: '', target_url: '', title: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const link = await createLink(form);
      onCreated(link);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Новая ссылка</h2>
        <form onSubmit={submit}>
          <label>
            Slug
            <input required value={form.slug} onChange={set('slug')} placeholder="e.g. klub" />
          </label>
          <label>
            Target URL
            <input required type="url" value={form.target_url} onChange={set('target_url')} placeholder="https://..." />
          </label>
          <label>
            Title
            <input value={form.title} onChange={set('title')} placeholder="Необязательно" />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
