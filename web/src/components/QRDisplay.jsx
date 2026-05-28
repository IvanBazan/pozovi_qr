import { useRef, useEffect, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';

const DOT_TYPES = ['square', 'dots', 'rounded', 'extra-rounded', 'classy-rounded'];
const CORNER_TYPES = ['square', 'dot', 'extra-rounded'];

export default function QRDisplay({ link }) {
  const containerRef = useRef();
  const qrRef = useRef(null);

  const [settings, setSettings] = useState({
    dotsColor: '#000000',
    bgColor: '#ffffff',
    dotsType: 'square',
    cornerType: 'square',
    logo: null,
  });

  const url = link ? `${window.location.origin}/${link.slug}` : '';

  useEffect(() => {
    if (!containerRef.current) return;

    const opts = buildOpts(url, settings);

    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling(opts);
      qrRef.current.append(containerRef.current);
    } else {
      qrRef.current.update(opts);
    }
  }, [link, settings]);

  if (!link) return <div className="panel empty-panel">Выберите ссылку из списка</div>;

  const set = (field) => (e) => setSettings(s => ({ ...s, [field]: e.target.value }));

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSettings(s => ({ ...s, logo: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const removeLogo = () => setSettings(s => ({ ...s, logo: null }));

  return (
    <div className="panel qr-panel">
      <h2>{link.title || link.slug}</h2>
      <p className="qr-url">{url}</p>

      <div ref={containerRef} className="qr-container" />

      <div className="qr-settings">
        <label>
          Цвет точек
          <input type="color" value={settings.dotsColor} onChange={set('dotsColor')} />
        </label>
        <label>
          Цвет фона
          <input type="color" value={settings.bgColor} onChange={set('bgColor')} />
        </label>
        <label>
          Стиль точек
          <select value={settings.dotsType} onChange={set('dotsType')}>
            {DOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Стиль углов
          <select value={settings.cornerType} onChange={set('cornerType')}>
            {CORNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="label-file">
          Логотип
          <input type="file" accept="image/png,image/svg+xml" onChange={handleLogo} />
        </label>
        {settings.logo && (
          <div className="logo-preview">
            <img src={settings.logo} alt="logo" />
            <button onClick={removeLogo}>✕</button>
          </div>
        )}
      </div>

      <div className="qr-actions">
        <button className="btn-download" onClick={() => qrRef.current?.download({ name: `qr-${link.slug}`, extension: 'png' })}>
          PNG
        </button>
        <button className="btn-download" onClick={() => qrRef.current?.download({ name: `qr-${link.slug}`, extension: 'svg' })}>
          SVG
        </button>
      </div>
    </div>
  );
}

function buildOpts(url, s) {
  return {
    width: 300,
    height: 300,
    data: url,
    image: s.logo || undefined,
    dotsOptions: { color: s.dotsColor, type: s.dotsType },
    backgroundOptions: { color: s.bgColor },
    cornerSquareOptions: { type: s.cornerType },
    imageOptions: { crossOrigin: 'anonymous', margin: 10 },
  };
}
