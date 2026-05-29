import { toggleLink } from '../api';

export default function LinkTable({ links, selected, onSelect, onAdd, onUpdate }) {
  const handleToggle = async (e, link) => {
    e.stopPropagation();
    const updated = await toggleLink(link.id, !link.is_active);
    onUpdate(updated);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Ссылки</h2>
        <button className="btn-primary" onClick={onAdd}>+ Добавить</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Slug</th>
            <th>Title</th>
            <th className="col-url">URL</th>
            <th className="col-status"></th>
          </tr>
        </thead>
        <tbody>
          {links.map(link => (
            <tr
              key={link.id}
              className={selected?.id === link.id ? 'selected' : ''}
              onClick={() => onSelect(link)}
            >
              <td><code>{link.slug}</code></td>
              <td>{link.title || '—'}</td>
              <td className="url-cell">{link.target_url}</td>
              <td className="col-status">
                <button
                  className={`btn-toggle ${link.is_active ? 'active' : 'inactive'}`}
                  onClick={(e) => handleToggle(e, link)}
                  title={link.is_active ? 'Деактивировать' : 'Активировать'}
                >
                  {link.is_active ? '✓' : '✗'}
                </button>
              </td>
            </tr>
          ))}
          {links.length === 0 && (
            <tr><td colSpan={4} className="empty">Нет ссылок</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
