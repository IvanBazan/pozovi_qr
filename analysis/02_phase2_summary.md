# Phase 2 — Admin API + Frontend

## Что реализовано

### Go API (`internal/handler/api.go`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/links` | Список всех ссылок |
| POST | `/api/links` | Создать ссылку (409 если slug занят) |
| PATCH | `/api/links/{id}` | Изменить `is_active` |
| GET | `/api/links/{id}/stats` | Total clicks + 10 последних |

Роутинг через `http.ServeMux` Go 1.22+ с method+path паттернами. `/api/*` зарегистрированы выше `/{slug}` — не перехватываются redirect-хэндлером.

JSON-контракт — snake_case. На Go-структурах `Link` и `ClickStat` проставлены json-теги.

### Storage (`internal/storage/postgres.go`)

Добавлены методы:
- `ListLinks` — все ссылки, ORDER BY created_at DESC
- `CreateLink` — INSERT RETURNING, возвращает полный объект
- `SetLinkActive` — UPDATE is_active RETURNING
- `GetLinkStats` — COUNT(*) + последние 10 кликов

Расширена структура `Link`: добавлены поля `Title`, `CreatedAt` с json-тегами.

### React-админка (`web/`)

Vite + React, без UI-фреймворков, plain CSS.

Компоненты:
- `LinkTable` — таблица ссылок, клик = выбор, кнопка-тогл ✓/✗ для деактивации
- `AddLinkModal` — форма создания ссылки
- `QRDisplay` — QR-код через `qrcode.react`, URL = `origin/{slug}`
- `ClickStats` — total + таблица последних кликов

`vite.config.js`: `base: '/admin/'` — ассеты собираются с путями `/admin/assets/...`, иначе nginx отдавал бы их через Go.

Доступна по `/admin`.

### Nginx

Конфиг — три location:
- `/admin` — SPA со статикой, `try_files` для client-side routing
- `/api/` — проксируется на app
- `/` — публичные редиректы

IP-ограничение для `/admin` и `/api/` — закомментировано, готово к включению.

### Docker

`nginx/Dockerfile` — multi-stage build:
1. `node:20-alpine` собирает фронт (`npm ci && npm run build`)
2. `nginx:1.27-alpine` копирует `dist/` в `/usr/share/nginx/html/admin`

Nginx-сервис в `docker-compose.yml` переведён с `image:` на `build:`.

---

## Открытые вопросы

| # | Что | Статус |
|---|-----|--------|
| 1 | IP-ограничение `/admin` и `/api/` | Готово, не включено |
| 2 | Деактивация ссылок через UI | ✅ Реализовано |
| 3 | Аутентификация в админке | Не реализована |
