export default function LinkTable({ links, selected, onSelect, onAdd }) {
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
            <th>URL</th>
            <th>Активна</th>
          </tr>
        </thead>
        <tbody>
          {links.map(link => (
            <tr
              key={link.ID}
              className={selected?.ID === link.ID ? 'selected' : ''}
              onClick={() => onSelect(link)}
            >
              <td><code>{link.Slug}</code></td>
              <td>{link.Title || '—'}</td>
              <td className="url-cell">{link.TargetURL}</td>
              <td>{link.IsActive ? '✓' : '✗'}</td>
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
