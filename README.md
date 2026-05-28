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

### Управление ссылками

Пока без админки — через psql:

```bash
docker compose exec postgres psql -U pozovi -d pozovi_qr
```

```sql
-- добавить ссылку
INSERT INTO links (slug, target_url, title) VALUES ('klub', 'https://t.me/pozovi', 'Телеграм клуба');

-- деактивировать
UPDATE links SET is_active = false WHERE slug = 'klub';
```
