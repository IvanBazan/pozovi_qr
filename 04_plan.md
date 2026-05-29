Задача: Заменить qrcode.react на qr-code-styling в компоненте QRDisplay. Добавить UI-настройки стиля QR-кода.
Установка:
bashcd web && npm install qr-code-styling
Компонент QRDisplay — что должен уметь:

Color pickers — два: цвет точек, цвет фона
Стиль точек — select: square, dots, rounded, extra-rounded, classy-rounded
Стиль углов (corner squares) — select: square, dot, extra-rounded
Логотип — input type="file" (png/svg), показывать превью. Логотип вписывается в центр QR-кода
Превью — рендерится в реальном времени при изменении любого параметра
Скачивание — две кнопки: "PNG" и "SVG"

Пример инициализации qr-code-styling:
jsimport QRCodeStyling from 'qr-code-styling';

const qrCode = new QRCodeStyling({
  width: 300,
  height: 300,
  data: "https://pozoviqr.ru/slug",
  image: logoDataUrl, // опционально
  dotsOptions: {
    color: "#ff6b35",
    type: "dots" // square | dots | rounded | extra-rounded | classy-rounded
  },
  backgroundOptions: {
    color: "#ffffff"
  },
  cornerSquareOptions: {
    type: "extra-rounded"
  },
  imageOptions: {
    crossOrigin: "anonymous",
    margin: 10
  }
});

qrCode.append(containerRef.current);
qrCode.download({ extension: "png" });
Layout правой панели:
┌─────────────────────┐
│  QR превью (300x300) │
├─────────────────────┤
│ Цвет точек  [____]  │
│ Цвет фона   [____]  │
│ Стиль точек  [▼]    │
│ Стиль углов  [▼]    │
│ Логотип [Загрузить]  │
├─────────────────────┤
│ [PNG]  [SVG]         │
├─────────────────────┤
│ Статистика           │
└─────────────────────┘
Важно: qr-code-styling работает с DOM напрямую (не React-компонент). Использовать useRef для контейнера и useEffect для обновления при смене параметров. При каждом изменении — очищать контейнер и вызывать qrCode.append() заново, либо использовать qrCode.update().