package clicklog

import (
	"context"
	"log/slog"
	"time"

	"github.com/ibaz/pozovi_qr/internal/storage"
)

const (
	bufSize       = 512
	flushInterval = 5 * time.Second
	batchSize     = 100
)

type Writer struct {
	ch    chan storage.Click
	store *storage.Store
	done  chan struct{}
}

func New(store *storage.Store) *Writer {
	w := &Writer{
		ch:    make(chan storage.Click, bufSize),
		store: store,
		done:  make(chan struct{}),
	}
	go w.run()
	return w
}

func (w *Writer) Log(c storage.Click) {
	select {
	case w.ch <- c:
	default:
		slog.Warn("clicklog buffer full, dropping click", "link_id", c.LinkID)
	}
}

func (w *Writer) Close() {
	close(w.ch)
	<-w.done
}

func (w *Writer) run() {
	defer close(w.done)

	ticker := time.NewTicker(flushInterval)
	defer ticker.Stop()

	buf := make([]storage.Click, 0, batchSize)

	flush := func() {
		if len(buf) == 0 {
			return
		}
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := w.store.InsertClicks(ctx, buf); err != nil {
			slog.Error("clicklog flush failed", "err", err)
		}
		buf = buf[:0]
	}

	for {
		select {
		case c, ok := <-w.ch:
			if !ok {
				flush()
				return
			}
			buf = append(buf, c)
			if len(buf) >= batchSize {
				flush()
			}
		case <-ticker.C:
			flush()
		}
	}
}
