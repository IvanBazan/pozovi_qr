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

CREATE INDEX idx_links_slug      ON links(slug);
CREATE INDEX idx_clicks_link_time ON clicks(link_id, clicked_at);
CREATE INDEX idx_clicks_time      ON clicks(clicked_at);
