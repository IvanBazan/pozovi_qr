package storage

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Link struct {
	ID        int64
	Slug      string
	TargetURL string
	Title     string
	IsActive  bool
	CreatedAt time.Time
}

type Click struct {
	LinkID    int64
	ClickedAt time.Time
	IP        string
	Country   string
	UserAgent string
	Referer   string
}

type Store struct {
	pool *pgxpool.Pool
}

func New(ctx context.Context, dsn string) (*Store, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	return &Store{pool: pool}, nil
}

func (s *Store) Close() {
	s.pool.Close()
}

func (s *Store) GetLink(ctx context.Context, slug string) (*Link, error) {
	row := s.pool.QueryRow(ctx,
		`SELECT id, slug, target_url, is_active FROM links WHERE slug = $1`,
		slug,
	)
	var l Link
	if err := row.Scan(&l.ID, &l.Slug, &l.TargetURL, &l.IsActive); err != nil {
		return nil, err
	}
	return &l, nil
}

func (s *Store) ListLinks(ctx context.Context) ([]Link, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, slug, target_url, title, is_active, created_at FROM links ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var links []Link
	for rows.Next() {
		var l Link
		if err := rows.Scan(&l.ID, &l.Slug, &l.TargetURL, &l.Title, &l.IsActive, &l.CreatedAt); err != nil {
			return nil, err
		}
		links = append(links, l)
	}
	return links, rows.Err()
}

func (s *Store) CreateLink(ctx context.Context, slug, targetURL, title string) (Link, error) {
	row := s.pool.QueryRow(ctx,
		`INSERT INTO links (slug, target_url, title)
		 VALUES ($1, $2, $3)
		 RETURNING id, slug, target_url, title, is_active, created_at`,
		slug, targetURL, title,
	)
	var l Link
	err := row.Scan(&l.ID, &l.Slug, &l.TargetURL, &l.Title, &l.IsActive, &l.CreatedAt)
	return l, err
}

type ClickStat struct {
	IP        string
	Country   string
	ClickedAt time.Time
}

func (s *Store) GetLinkStats(ctx context.Context, linkID int64) (int64, []ClickStat, error) {
	var total int64
	if err := s.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM clicks WHERE link_id = $1`, linkID,
	).Scan(&total); err != nil {
		return 0, nil, err
	}

	rows, err := s.pool.Query(ctx,
		`SELECT ip, country, clicked_at FROM clicks
		 WHERE link_id = $1 ORDER BY clicked_at DESC LIMIT 10`,
		linkID,
	)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()

	var recent []ClickStat
	for rows.Next() {
		var c ClickStat
		if err := rows.Scan(&c.IP, &c.Country, &c.ClickedAt); err != nil {
			return 0, nil, err
		}
		recent = append(recent, c)
	}
	return total, recent, rows.Err()
}

func (s *Store) InsertClicks(ctx context.Context, clicks []Click) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, c := range clicks {
		_, err := tx.Exec(ctx,
			`INSERT INTO clicks (link_id, clicked_at, ip, country, user_agent, referer)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			c.LinkID, c.ClickedAt, c.IP, c.Country, c.UserAgent, c.Referer,
		)
		if err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
