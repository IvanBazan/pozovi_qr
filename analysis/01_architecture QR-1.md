# QR Redirect Service — Architecture

## Суть проекта

Сервис коротких ссылок для QR-кодов некоммерческого турклуба.
Стикеры с QR-кодами ведут на `yourdomain.com/{slug}`, сервис логирует метаданные клика и делает 302-редирект на целевой URL (соцсети, сайт клуба и т.д.).

## Стек

- **Redirect-сервис:** Go (stdlib net/http, pgx, oschwald/maxminddb)
- **БД:** PostgreSQL
- **Прокси:** nginx (reverse proxy, выставляет X-Forwarded-For)
- **Админка (позже):** React (Vite)
- **Деплой:** Docker + docker-compose, автоматизация через Ansible/bash
- **Geo:** MaxMind GeoLite2

## Инфраструктура

| VPS | Роль |
|---|---|
| Россия | Основной: nginx + redirect-сервис + PostgreSQL |
| Нидерланды | Бэкап БД, резервный инстанс |

Аудитория преимущественно в РФ, но есть зарубежные пользователи.

## Схема БД (MVP)

```sql
CREATE TABLE links (
    id          BIGSERIAL PRIMARY KEY,
    slug        VARCHAR(32) UNIQUE NOT NULL,
    target_url  TEXT NOT NULL,
    title       VARCHAR(255),
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE clicks (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    link_id     BIGINT NOT NULL REFERENCES links(id),
    clicked_at  TIMESTAMPTZ DEFAULT now(),
    ip          INET,
    country     VARCHAR(2),
    user_agent  TEXT,
    referer     TEXT
);

CREATE INDEX idx_clicks_link_time ON clicks(link_id, clicked_at);
CREATE INDEX idx_clicks_time ON clicks(clicked_at);
CREATE INDEX idx_links_slug ON links(slug);
```

## Redirect-сервис (Go)

### Эндпоинты

- `GET /{slug}` — lookup → async лог клика → 302 redirect
- `GET /health` — healthcheck

### Структура проекта

```
cmd/redirector/main.go
internal/handler/redirect.go
internal/storage/postgres.go
internal/geo/geo.go
internal/clicklog/writer.go
```

### Ключевые решения

- Запись кликов через буферизированный канал + батч-insert, чтобы не блокировать редирект.
- Geo-резолв (IP → country) в момент записи клика. IP не храним дольше необходимого (GDPR).
- Конфиг через env.

## Что дальше (после MVP)

- Админка на React: CRUD ссылок, статистика, генерация QR-кодов
- Парсинг User-Agent → device_type, os, browser
- Детальный geo (city)
- Автоматизация деплоя и бэкапов
- Мониторинг (Prometheus + Grafana или аналог)