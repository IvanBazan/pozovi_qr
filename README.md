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

### Basic Auth

Защищает `/admin` и `/api/`. Публичные редиректы `/{slug}` остаются без авторизации.

```bash
apt install apache2-utils -y
htpasswd -c nginx/.htpasswd admin   # введёт пароль интерактивно
docker compose up -d --build nginx
```

Для добавления второго пользователя (без `-c`, чтобы не перезаписать файл):

```bash
htpasswd nginx/.htpasswd user2
```

---

### SSL (Let's Encrypt)

Выполнить один раз на VPS. Nginx нужно остановить — certbot займёт порт 80 для проверки домена.

```bash
apt install certbot -y
docker compose stop nginx
certbot certonly --standalone -d pozoviqr.ru
docker compose up -d --build nginx
```

Сертификаты сохранятся в `/etc/letsencrypt/live/pozoviqr.ru/` и будут примонтированы в nginx автоматически.

**Обновление сертификата** (раз в 90 дней):

```bash
docker compose stop nginx
certbot renew
docker compose up -d nginx
```

---

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

# деактивировать / активировать ссылку
curl -X PATCH http://<ip>/api/links/1 \
  -H 'Content-Type: application/json' \
  -d '{"is_active": false}'

# статистика по ссылке (id из списка)
curl http://<ip>/api/links/1/stats
```

### Админка

Доступна по адресу `http://<ip>/admin` после деплоя.

Возможности:
- Список всех ссылок
- Создание новой ссылки (slug, URL, title)
- Деактивация / активация ссылки кнопкой в таблице
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
