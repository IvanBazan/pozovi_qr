package handler

import (
	"errors"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/ibaz/pozovi_qr/internal/clicklog"
	"github.com/ibaz/pozovi_qr/internal/geo"
	"github.com/ibaz/pozovi_qr/internal/storage"
	"github.com/jackc/pgx/v5"
)

type Redirect struct {
	store  *storage.Store
	geodb  *geo.DB
	logger *clicklog.Writer
}

func NewRedirect(store *storage.Store, geodb *geo.DB, logger *clicklog.Writer) *Redirect {
	return &Redirect{store: store, geodb: geodb, logger: logger}
}

func (h *Redirect) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimPrefix(r.URL.Path, "/")
	if slug == "" {
		http.NotFound(w, r)
		return
	}

	link, err := h.store.GetLink(r.Context(), slug)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && !link.IsActive) {
		http.NotFound(w, r)
		return
	}
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	h.logger.Log(storage.Click{
		LinkID:    link.ID,
		ClickedAt: time.Now().UTC(),
		IP:        clientIP(r),
		Country:   h.country(r),
		UserAgent: r.UserAgent(),
		Referer:   r.Referer(),
	})

	http.Redirect(w, r, link.TargetURL, http.StatusFound)
}

func (h *Redirect) country(r *http.Request) string {
	if h.geodb == nil {
		return ""
	}
	ip := net.ParseIP(clientIP(r))
	if ip == nil {
		return ""
	}
	return h.geodb.Country(ip)
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.SplitN(xff, ",", 2)[0])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
