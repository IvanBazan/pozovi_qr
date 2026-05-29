# Phase 4 — QR Code Styling & Settings Persistence

## Что реализовано

### Замена библиотеки QR

`qrcode.react` → `qr-code-styling`. Библиотека работает с DOM напрямую (не React-компонент):

```js
const qr = new QRCodeStyling(opts);
qr.append(containerRef.current);  // превью
qr.download({ name, extension }); // скачивание
```

Превью всегда `280px` (фиксированный `PREVIEW_SIZE`). Размер для скачивания — отдельный параметр в настройках. При каждом изменении: `innerHTML = ''` + новый инстанс (вместо `.update()`).

Фикс: `type: 'svg'` в конфиге — canvas-рендер игнорировал corner-опции, SVG работает корректно.  
Фикс: правильные имена свойств — `cornersSquareOptions` / `cornersDotOptions` (множественное число).

### Настройки QR (QRDisplay.jsx)

| Настройка | Контрол |
|-----------|---------|
| Стиль точек | select: square/dots/rounded/extra-rounded/classy-rounded |
| Цвет точек | ColorInput (picker + HEX) |
| Градиент | toggle + тип (linear/radial) + 2 цвета |
| Цвет фона | ColorInput |
| Стиль углов | select: square/dot/extra-rounded |
| Цвет углов | ColorInput |
| Стиль угловых точек | select: square/dot |
| Цвет угловых точек | ColorInput |
| Логотип | file input (PNG/SVG) + размер + отступ |
| Размер (скачивание) | range 200–1000px |

`ColorInput` — переиспользуемый компонент: пикер `32×32` + HEX-инпут с валидацией `^#[0-9a-fA-F]{0,6}$`.

### Layout

- Два прохода через варианты: 2→3→2 колонки
- Финальный: `380px | 1fr` — слева таблица + статистика, справа QR и настройки
- `max-width: 1200px; margin: 0 auto` на `.layout`
- `index.css` полностью переписан — убраны Vite-дефолты (`width: 1126px`, `color-scheme: light dark`, `text-align: center`)
- Настройки QR — двухколоночная сетка внутри панели: Основные+Цвета слева, Углы+Логотип справа

### Сохранение настроек в БД

**Миграция:** `ALTER TABLE links ADD COLUMN qr_settings JSONB DEFAULT '{}'`

**Storage:** `PatchLink(ctx, id, isActive *bool, qrSettings json.RawMessage)` — единый UPDATE с COALESCE, заменил раздельные `SetLinkActive` + `UpdateLinkQRSettings`.

**API:** `PATCH /api/links/{id}` принимает `is_active` и/или `qr_settings` независимо.

**Фронт:**
- При выборе ссылки: `setS({ ...DEFAULTS, ...link.qr_settings })`
- Auto-save: debounce 500ms через `useEffect([s])`
- Флаг `initialized` (useRef) — предотвращает save при первичной загрузке из БД
- После успешного PATCH: `onSettingsUpdate(linkId, settings)` обновляет объект в массиве `links` локально

---

## Открытые вопросы

| # | Что | Статус |
|---|-----|--------|
| 1 | Логотип хранится как base64 в JSONB — большие изображения раздуют БД | Некритично для MVP |
| 2 | Auto-save без индикатора — пользователь не видит что настройки сохранились | Можно добавить «Сохранено» |
