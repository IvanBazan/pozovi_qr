# Phase 2 — Admin API + Frontend

## Контекст

MVP redirect-сервис работает. Нужно добавить API для управления ссылками и React-админку.

## 1. API эндпоинты (Go)

Добавить новый хэндлер `internal/handler/api.go`. Роутинг через `http.ServeMux`.

### GET /api/links

Возвращает все ссылки.

```json
[
  {
    "id": 1,
    "slug": "google",
    "target_url": "https://google.com",
    "title": "Google",
    "is_active": true,
    "created_at": "2026-05-28T19:50:00Z"
  }
]
```

### POST /api/links

Создаёт новую ссылку. Возвращает `201` + объект. `409` если slug занят.

Request:
```json
{
  "slug": "klub",
  "target_url": "https://t.me/pozovi",
  "title": "Телеграм клуба"
}
```

Response: тот же формат что в GET, один объект.

### GET /api/links/{id}/stats

Статистика по ссылке: total + 10 последних кликов.

```json
{
  "total_clicks": 42,
  "recent_clicks": [
    {
      "ip": "185.1.2.3",
      "country": "RU",
      "clicked_at": "2026-05-28T19:50:15Z"
    }
  ]
}
```

### Storage-методы (добавить в `internal/storage/postgres.go`)

```go
func (s *Store) ListLinks(ctx context.Context) ([]Link, error)
func (s *Store) CreateLink(ctx context.Context, slug, targetURL, title string) (Link, error)
func (s *Store) GetLinkStats(ctx context.Context, linkID int64) (totalClicks int, recentClicks []Click, error)
```

SQL для stats:
```sql
-- total
SELECT COUNT(*) FROM clicks WHERE link_id = $1;

-- recent 10
SELECT ip, country, clicked_at FROM clicks
WHERE link_id = $1 ORDER BY clicked_at DESC LIMIT 10;
```

### Роутинг (в `cmd/redirector/main.go`)

```go
mux := http.NewServeMux()
mux.HandleFunc("GET /health", healthHandler)
mux.HandleFunc("GET /api/links", apiHandler.ListLinks)
mux.HandleFunc("POST /api/links", apiHandler.CreateLink)
mux.HandleFunc("GET /api/links/{id}/stats", apiHandler.GetStats)
mux.Handle("GET /{slug}", redirectHandler) // последним — catch-all
```

Важно: `/api/*` и `/health` должны быть выше `/{slug}` чтобы не перехватывались redirect-хэндлером.

---

## 2. Frontend (React + Vite)

Создать директорию `web/` в корне проекта.

### Инициализация

```bash
cd web
npm create vite@latest . -- --template react
npm install qrcode.react
```

### Layout

Один экран, split на две колонки:

```
┌──────────────────────┬──────────────────────┐
│                      │                      │
│   Таблица ссылок     │   QR-код (qrcode.react)
│   (slug, title,      │   для выбранной      │
│    target, active)   │   ссылки             │
│                      ├──────────────────────┤
│                      │                      │
│   Клик по строке =   │   Статистика:        │
│   выбор ссылки       │   - total clicks     │
│                      │   - 10 последних     │
│                      │     (ip + datetime)  │
│ [+ Добавить ссылку]  │                      │
└──────────────────────┴──────────────────────┘
```

### Компоненты

- `App.jsx` — layout, state: selectedLink
- `LinkTable.jsx` — таблица ссылок, подсветка выбранной, кнопка "Добавить"
- `AddLinkModal.jsx` — форма: slug, target_url, title
- `QRDisplay.jsx` — QR-код через `<QRCodeSVG value={url} />`
- `ClickStats.jsx` — total + таблица последних кликов

### QR-код

Генерится на клиенте. URL = `http://{window.location.host}/{slug}`.

### API-клиент

```js
const API = '/api';

export const fetchLinks = () => fetch(`${API}/links`).then(r => r.json());
export const createLink = (data) => fetch(`${API}/links`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
}).then(r => r.json());
export const fetchStats = (id) => fetch(`${API}/links/${id}/stats`).then(r => r.json());
```

### Стиль

Минимальный, чистый. Без UI-фреймворков — plain CSS или CSS modules. Не тратить время на дизайн, функциональность важнее.

---

## 3. Nginx

Добавить в `nginx.conf`:

```nginx
# Admin SPA
location /admin {
    alias /usr/share/nginx/html/admin;
    try_files $uri $uri/ /admin/index.html;
    allow <ADMIN_IP>;
    deny all;
}

# API
location /api/ {
    allow <ADMIN_IP>;
    deny all;
    proxy_pass http://app:8080;
}
```

Билд фронта копировать в nginx-контейнер:
- Добавить multi-stage build или отдельный этап в docker-compose для `web/`.
- Результат `npm run build` → `/usr/share/nginx/html/admin/`.

---

## 4. Docker

Варианты для фронта:

**Вариант A (проще):** multi-stage в Dockerfile nginx:
```dockerfile
FROM node:20-alpine AS frontend
WORKDIR /app
COPY web/package*.json ./
RUN npm ci
COPY web/ .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=frontend /app/dist /usr/share/nginx/html/admin
COPY nginx/nginx.conf /etc/nginx/nginx.conf
```

**Вариант B:** отдельный сервис, но для MVP избыточно.

Рекомендую вариант A.

---

## Порядок реализации

1. Storage-методы: `ListLinks`, `CreateLink`, `GetLinkStats`
2. API-хэндлер: `internal/handler/api.go`
3. Роутинг в `main.go`
4. Проверить API через curl
5. React-приложение в `web/`
6. Nginx конфиг + Dockerfile
7. `docker compose up -d --build`, проверить