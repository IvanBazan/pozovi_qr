import { QRCodeSVG } from 'qrcode.react';

export default function QRDisplay({ link }) {
  if (!link) return <div className="panel empty-panel">Выберите ссылку</div>;

  const url = `${window.location.origin}/${link.slug}`;

  return (
    <div className="panel qr-panel">
      <h2>QR-код</h2>
      <p className="qr-url">{url}</p>
      <QRCodeSVG value={url} size={200} />
    </div>
  );
}
