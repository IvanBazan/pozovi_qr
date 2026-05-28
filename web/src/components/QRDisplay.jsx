import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QRDisplay({ link }) {
  const qrRef = useRef();

  if (!link) return <div className="panel empty-panel">Выберите ссылку из списка</div>;

  const url = `${window.location.origin}/${link.slug}`;

  const handleDownload = () => {
    const canvas = qrRef.current.querySelector('canvas');
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `qr-${link.slug}.png`;
    a.click();
  };

  return (
    <div className="panel qr-panel">
      <h2>{link.title || link.slug}</h2>
      <p className="qr-url">{url}</p>
      <div ref={qrRef}>
        <QRCodeCanvas value={url} size={200} />
      </div>
      <button className="btn-download" onClick={handleDownload}>Скачать PNG</button>
    </div>
  );
}
