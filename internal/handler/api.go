package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/ibaz/pozovi_qr/internal/storage"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type API struct {
	store *storage.Store
}

func NewAPI(store *storage.Store) *API {
	return &API{store: store}
}

func (a *API) ListLinks(w http.ResponseWriter, r *http.Request) {
	links, err := a.store.ListLinks(r.Context())
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}
	if links == nil {
		links = []storage.Link{}
	}
	jsonOK(w, links)
}

func (a *API) CreateLink(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Slug      string `json:"slug"`
		TargetURL string `json:"target_url"`
		Title     string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid json", http.StatusBadRequest)
		return
	}
	if body.Slug == "" || body.TargetURL == "" {
		jsonError(w, "slug and target_url are required", http.StatusBadRequest)
		return
	}

	link, err := a.store.CreateLink(r.Context(), body.Slug, body.TargetURL, body.Title)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			jsonError(w, "slug already exists", http.StatusConflict)
			return
		}
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(link)
}

func (a *API) PatchLink(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		jsonError(w, "invalid id", http.StatusBadRequest)
		return
	}

	var body struct {
		IsActive   *bool            `json:"is_active"`
		QRSettings *json.RawMessage `json:"qr_settings"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid json", http.StatusBadRequest)
		return
	}
	if body.IsActive == nil && body.QRSettings == nil {
		jsonError(w, "is_active or qr_settings required", http.StatusBadRequest)
		return
	}

	var qrSettings json.RawMessage
	if body.QRSettings != nil {
		qrSettings = *body.QRSettings
	}

	link, err := a.store.PatchLink(r.Context(), id, body.IsActive, qrSettings)
	if errors.Is(err, pgx.ErrNoRows) {
		jsonError(w, "not found", http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}
	jsonOK(w, link)
}

func (a *API) GetStats(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		jsonError(w, "invalid id", http.StatusBadRequest)
		return
	}

	total, recent, err := a.store.GetLinkStats(r.Context(), id)
	if errors.Is(err, pgx.ErrNoRows) {
		jsonError(w, "not found", http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}
	if recent == nil {
		recent = []storage.ClickStat{}
	}

	jsonOK(w, map[string]any{
		"total_clicks":  total,
		"recent_clicks": recent,
	})
}

func jsonOK(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
