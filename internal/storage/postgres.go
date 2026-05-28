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
	IsActive  bool
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
