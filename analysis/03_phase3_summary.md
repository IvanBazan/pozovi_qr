# Phase 3 — Security, SSL, UI Fixes

## Что реализовано

### HTTPS (Let's Encrypt)

`nginx/default.conf` разбит на два server-блока:
- Порт 80 → 301 на `https://pozoviqr.ru`
- Порт 443 с SSL: `fullchain.pem` / `privkey.pem` из `/etc/letsencrypt/live/pozoviqr.ru/`

`docker-compose.yml` — nginx монтирует `/etc/letsencrypt:/etc/letsencrypt:ro`.

Получение сертификата:
```bash
docker compose stop nginx
certbot certonly --standalone -d pozoviqr.ru
docker compose up -d --build nginx
```

### Basic Auth

nginx закрывает `/admin` и `/api/` через `auth_basic` + `.htpasswd`.  
Публичные редиректы `/{slug}` остаются открытыми.

`.htpasswd` исключён из git, монтируется как volume `./nginx/.htpasswd:/etc/nginx/.htpasswd:ro`.

### UI Fixes (Phase 2.1)

| Проблема | Решение |
|----------|---------|
| Slug и IP не видны в таблицах | `color: #1a1a2e` на `code` |
| Кнопка «Отмена» в модалке не видна | `color: #333` явно |
| Тёмные placeholder в полях | `.modal input::placeholder { color: #aaa }` |
| Vite собирал ассеты в `/assets/` вместо `/admin/assets/` | `base: '/admin/'` в `vite.config.js` |
| JSON-ключи API в PascalCase вместо snake_case | Добавлены json-теги на `Link` и `ClickStat` |

### Дополнительно

- Кнопка скачивания QR — `QRCodeCanvas` + `useRef`, скачивание PNG
- Деактивация ссылок через UI — `PATCH /api/links/{id}` + кнопка-тогл в таблице
- URL валидация в модалке — проверка `^https?://`
- Колонка «Страна» в статистике скрывается если нет данных
- Автовыбор первой ссылки при загрузке

---

## Открытые вопросы

| # | Что | Статус |
|---|-----|--------|
| 1 | Обновление сертификата (раз в 90 дней) | Ручное, описано в README |
| 2 | IP-ограничение заменено на Basic Auth | ✅ Закрыто |
