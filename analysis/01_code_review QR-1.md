# Code Review — MVP v1

## storage/postgres.go

**Хорошо:** pgxpool из коробки, простые запросы без лишних абстракций.

**Проблема:** `InsertClicks` делает батч через цикл `tx.Exec` — N round-trips вместо одного. Для 100 кликов это заметно. Лучше `UNNEST`-вставка:
```sql
INSERT INTO clicks (link_id, clicked_at, ip, country, user_agent, referer)
SELECT * FROM UNNEST($1::bigint[], $2::timestamptz[], $3::inet[], $4::varchar[], $5::text[], $6::text[])
```

**Проблема:** нет retry при потере соединения с БД. Если postgres перезапустится — батч потеряется.

---

## clicklog/writer.go

**Хорошо:** неблокирующий `select` с `default`, таймер + батч — правильная схема.

**Проблема:** при заполнении буфера клики молча дропаются (только `slog.Warn`). Стоит добавить счётчик потерь.

**Проблема:** `Close()` ждёт `done`, но если `flush()` завис на `InsertClicks` дольше 15 сек (таймаут graceful shutdown) — данные потеряются. Сейчас внутренний контекст flush имеет таймаут 10 сек — в рамках нормы, но граница близкая.

---

## handler/redirect.go

**Хорошо:** `clientIP` корректно обрабатывает `X-Forwarded-For`, `pgx.ErrNoRows` отделена от серверных ошибок.

**✅ Решено:** nginx выставляет `X-Forwarded-For $remote_addr` — всегда реальный IP клиента, app снаружи не доступен, подделать заголовок нельзя.

**Проблема (производительность):** нет кэша ссылок. Каждый редирект — SELECT в БД. Простой `sync.Map` с TTL даст значительный прирост для активных QR-кодов.

---

## cmd/redirector/main.go

**Хорошо:** graceful shutdown, опциональный GeoIP, конфиг только через env.

**Проблема:** нет таймаута на `storage.New` — при недоступном PostgreSQL приложение зависнет. `depends_on: service_healthy` в compose защищает в Docker, но не при ручном запуске.

**Проблема:** нет `IdleTimeout` в `http.Server`. Рекомендуется `IdleTimeout: 60s` чтобы не держать idle keep-alive соединения бесконечно.

---

## Приоритеты

| # | Приоритет | Что |
|---|-----------|-----|
| 1 | ✅ Закрыто | `X-Forwarded-For` — nginx выставляет из `$remote_addr` |
| 2 | До прода | `UNNEST`-insert вместо цикла в `InsertClicks` |
| 3 | Желательно | In-memory кэш slug → target_url (TTL ~60s) |
| 4 | Мелочь | `IdleTimeout` в `http.Server` |
| 5 | Мелочь | Счётчик дропнутых кликов |
