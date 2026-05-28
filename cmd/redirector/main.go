package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ibaz/pozovi_qr/internal/clicklog"
	"github.com/ibaz/pozovi_qr/internal/geo"
	"github.com/ibaz/pozovi_qr/internal/handler"
	"github.com/ibaz/pozovi_qr/internal/storage"
)

func main() {
	dsn := mustEnv("DATABASE_URL")
	addr := getEnv("ADDR", ":8080")
	geoPath := getEnv("GEOIP_PATH", "")

	ctx := context.Background()

	store, err := storage.New(ctx, dsn)
	if err != nil {
		slog.Error("db connect failed", "err", err)
		os.Exit(1)
	}
	defer store.Close()

	var geodb *geo.DB
	if geoPath != "" {
		geodb, err = geo.Open(geoPath)
		if err != nil {
			slog.Error("geo db open failed", "err", err)
			os.Exit(1)
		}
		defer geodb.Close()
	}

	clWriter := clicklog.New(store)
	defer clWriter.Close()

	apiHandler := handler.NewAPI(store)
	redirectHandler := handler.NewRedirect(store, geodb, clWriter)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("GET /api/links", apiHandler.ListLinks)
	mux.HandleFunc("POST /api/links", apiHandler.CreateLink)
	mux.HandleFunc("GET /api/links/{id}/stats", apiHandler.GetStats)
	mux.Handle("/", redirectHandler)

	srv := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
	}

	go func() {
		slog.Info("starting", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down")
	shutCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	srv.Shutdown(shutCtx)
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		slog.Error("required env var missing", "key", key)
		os.Exit(1)
	}
	return v
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
