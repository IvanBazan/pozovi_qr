import { useRef, useEffect, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';

function ColorInput({ value, onChange }) {
  return (
    <div className="color-input">
      <input type="color" value={value} onChange={onChange} />
      <input
        type="text"
        value={value}
        maxLength={7}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(e);
        }}
      />
    </div>
  );
}

const DOT_TYPES         = ['square', 'dots', 'rounded', 'extra-rounded', 'classy-rounded'];
const CORNER_TYPES      = ['square', 'dot', 'extra-rounded'];
const CORNER_DOT_TYPES  = ['square', 'dot'];
const GRADIENT_TYPES    = ['linear', 'radial'];
const PREVIEW_SIZE      = 280;

const DEFAULTS = {
  size:           600,
  dotsColor:      '#000000',
  dotsColor2:     '#000000',
  bgColor:        '#ffffff',
  dotsType:       'square',
  cornerType:     'square',
  cornerDotType:  'square',
  cornerColor:    '#000000',
  cornerDotColor: '#000000',
  gradient:       false,
  gradientType:   'linear',
  logo:           null,
  logoSize:       0.3,
  logoMargin:     10,
};

export default function QRDisplay({ link }) {
  const containerRef = useRef();
  const [s, setS] = useState(DEFAULTS);

  const url = link ? `${window.location.origin}/${link.slug}` : '';

  useEffect(() => {
    if (!containerRef.current || !url) return;
    containerRef.current.innerHTML = '';
    const qr = new QRCodeStyling(buildOpts(url, s, PREVIEW_SIZE));
    qr.append(containerRef.current);
  }, [url, s]);

  if (!link) return <div className="panel empty-panel">Выберите ссылку из списка</div>;

  const set = (field) => (e) => setS(p => ({ ...p, [field]: e.target.value }));
  const setNum = (field) => (e) => setS(p => ({ ...p, [field]: Number(e.target.value) }));
  const toggle = (field) => () => setS(p => ({ ...p, [field]: !p[field] }));

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setS(p => ({ ...p, logo: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleDownload = (ext) => {
    const qr = new QRCodeStyling(buildOpts(url, s, s.size));
    qr.download({ name: `qr-${link.slug}`, extension: ext });
  };

  return (
    <div className="panel qr-panel">
      <h2>{link.title || link.slug}</h2>
      <p className="qr-url">{url}</p>

      <div ref={containerRef} className="qr-container" />

      <div className="qr-settings">

        <span className="settings-label">Размер (скачивание)</span>
        <div className="settings-range">
          <input type="range" min="200" max="1000" step="50" value={s.size} onChange={setNum('size')} />
          <span>{s.size}px</span>
        </div>

        <span className="settings-label">Стиль точек</span>
        <select value={s.dotsType} onChange={set('dotsType')}>
          {DOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <span className="settings-label">Градиент</span>
        <label className="toggle">
          <input type="checkbox" checked={s.gradient} onChange={toggle('gradient')} />
          {s.gradient ? 'Вкл' : 'Выкл'}
        </label>

        {s.gradient ? (
          <>
            <span className="settings-label">Тип градиента</span>
            <select value={s.gradientType} onChange={set('gradientType')}>
              {GRADIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <span className="settings-label">Цвет 1</span>
            <ColorInput value={s.dotsColor} onChange={set('dotsColor')} />

            <span className="settings-label">Цвет 2</span>
            <ColorInput value={s.dotsColor2} onChange={set('dotsColor2')} />
          </>
        ) : (
          <>
            <span className="settings-label">Цвет точек</span>
            <ColorInput value={s.dotsColor} onChange={set('dotsColor')} />
          </>
        )}

        <span className="settings-label">Цвет фона</span>
        <ColorInput value={s.bgColor} onChange={set('bgColor')} />

        <span className="settings-label">Стиль углов</span>
        <select value={s.cornerType} onChange={set('cornerType')}>
          {CORNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <span className="settings-label">Цвет углов</span>
        <ColorInput value={s.cornerColor} onChange={set('cornerColor')} />

        <span className="settings-label">Стиль угл. точек</span>
        <select value={s.cornerDotType} onChange={set('cornerDotType')}>
          {CORNER_DOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <span className="settings-label">Цвет угл. точек</span>
        <ColorInput value={s.cornerDotColor} onChange={set('cornerDotColor')} />

        <span className="settings-label">Логотип</span>
        <input type="file" accept="image/png,image/svg+xml" onChange={handleLogo} />

        {s.logo && (
          <>
            <span className="settings-label">
              <img src={s.logo} alt="logo" className="logo-thumb" />
            </span>
            <button className="btn-remove-logo" onClick={() => setS(p => ({ ...p, logo: null }))}>
              Удалить лого
            </button>

            <span className="settings-label">Размер лого</span>
            <div className="settings-range">
              <input type="range" min="0.1" max="0.5" step="0.05" value={s.logoSize} onChange={setNum('logoSize')} />
              <span>{Math.round(s.logoSize * 100)}%</span>
            </div>

            <span className="settings-label">Отступ лого</span>
            <div className="settings-range">
              <input type="range" min="0" max="20" step="1" value={s.logoMargin} onChange={setNum('logoMargin')} />
              <span>{s.logoMargin}px</span>
            </div>
          </>
        )}
      </div>

      <div className="qr-actions">
        <button className="btn-download" onClick={() => handleDownload('png')}>PNG</button>
        <button className="btn-download" onClick={() => handleDownload('svg')}>SVG</button>
      </div>
    </div>
  );
}

function buildOpts(url, s, size) {
  const dotsOptions = s.gradient
    ? {
        type: s.dotsType,
        gradient: {
          type: s.gradientType,
          rotation: 0,
          colorStops: [
            { offset: 0, color: s.dotsColor },
            { offset: 1, color: s.dotsColor2 },
          ],
        },
      }
    : { color: s.dotsColor, type: s.dotsType };

  return {
    width:  size,
    height: size,
    data:   url,
    image:  s.logo || undefined,
    dotsOptions,
    backgroundOptions:   { color: s.bgColor },
    cornerSquareOptions: { type: s.cornerType,    color: s.cornerColor },
    cornerDotOptions:    { type: s.cornerDotType, color: s.cornerDotColor },
    imageOptions: {
      crossOrigin: 'anonymous',
      imageSize:   s.logoSize,
      margin:      s.logoMargin,
    },
  };
}
