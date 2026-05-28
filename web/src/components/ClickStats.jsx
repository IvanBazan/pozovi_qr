import { useEffect, useState } from 'react';
import { fetchStats } from '../api';

export default function ClickStats({ link }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!link) return;
    setStats(null);
    fetchStats(link.ID).then(setStats);
  }, [link?.ID]);

  if (!link) return null;
  if (!stats) return <div className="panel"><p>Загрузка...</p></div>;

  return (
    <div className="panel">
      <h2>Статистика</h2>
      <p className="total">Всего кликов: <strong>{stats.total_clicks}</strong></p>
      {stats.recent_clicks.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>IP</th>
              <th>Страна</th>
              <th>Время</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent_clicks.map((c, i) => (
              <tr key={i}>
                <td><code>{c.IP}</code></td>
                <td>{c.Country || '—'}</td>
                <td>{new Date(c.ClickedAt).toLocaleString('ru')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty">Кликов пока нет</p>
      )}
    </div>
  );
}
