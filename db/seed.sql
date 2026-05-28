INSERT INTO links (slug, target_url, title) VALUES
    ('google',   'https://google.com',    'Google'),
    ('yandex',   'https://yandex.ru',     'Яндекс'),
    ('github',   'https://github.com',    'GitHub'),
    ('wiki',     'https://wikipedia.org', 'Wikipedia'),
    ('youtube',  'https://youtube.com',   'YouTube')
ON CONFLICT (slug) DO NOTHING;
