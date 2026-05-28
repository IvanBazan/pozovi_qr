# pozovi_qr

QR-code redirect service with click analytics for pozovi.tours.

## Deploy

### Требования

- VPS с Docker и Docker Compose
- Открытый порт 80

### Быстрый старт

```bash
git clone <repo> && cd pozovi_qr
cp .env.example .env        # задать POSTGRES_PASSWORD и DATABASE_URL
docker compose up -d --build
docker compose exec postgres psql -U pozovi -d pozovi_qr < db/seed.sql
curl -I http://<vps-ip>/google   # → HTTP 302
```

### GeoIP (опционально)

```bash
# 1. Скачать GeoLite2-Country.mmdb и положить в ./data/
cp docker-compose.override.yml.example docker-compose.override.yml
# 2. Добавить в .env:
#    GEOIP_PATH=/data/geo.mmdb
docker compose up -d
```

### API

```bash
# список всех ссылок
curl http://<ip>/api/links

# создать ссылку
curl -X POST http://<ip>/api/links \
  -H 'Content-Type: application/json' \
  -d '{"slug":"klub","target_url":"https://t.me/tkpozovi","title":"Телеграм клуба"}'

# статистика по ссылке (id из списка)
curl http://<ip>/api/links/1/stats
```

### Админка

Доступна по адресу `http://<ip>/admin` после деплоя.

Возможности:
- Список всех ссылок
- Создание новой ссылки (slug, URL, title)
- QR-код для выбранной ссылки (генерируется на клиенте)
- Статистика кликов: total + 10 последних (IP, страна, время)

**IP-ограничение** (рекомендуется): раскомментировать в `nginx/default.conf`:
```nginx
allow <ADMIN_IP>;
deny all;
```
для блоков `/admin` и `/api/`, затем `docker compose up -d --build`.

---

### Управление ссылками

Альтернативно — через psql:

```bash
docker compose exec postgres psql -U pozovi -d pozovi_qr
```

```sql
-- добавить ссылку
INSERT INTO links (slug, target_url, title) VALUES ('klub', 'https://t.me/tkpozovi', 'Телеграм клуба');

-- деактивировать
UPDATE links SET is_active = false WHERE slug = 'klub';
```
