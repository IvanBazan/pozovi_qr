package geo

import (
	"net"

	"github.com/oschwald/maxminddb-golang"
)

type DB struct {
	reader *maxminddb.Reader
}

func Open(path string) (*DB, error) {
	r, err := maxminddb.Open(path)
	if err != nil {
		return nil, err
	}
	return &DB{reader: r}, nil
}

func (db *DB) Close() error {
	return db.reader.Close()
}

func (db *DB) Country(ip net.IP) string {
	var record struct {
		Country struct {
			ISOCode string `maxminddb:"iso_code"`
		} `maxminddb:"country"`
	}
	if err := db.reader.Lookup(ip, &record); err != nil {
		return ""
	}
	return record.Country.ISOCode
}
