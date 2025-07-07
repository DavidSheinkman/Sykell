package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// URL represents the DB model (you could also import from models package)
type URL struct {
	ID        int     `json:"id"`
	URL       string  `json:"url"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"created_at"`
	LastRunAt *string `json:"last_run_at"` // nullable
}

// GET /api/urls
func GetURLs(c *gin.Context) {
	db := c.MustGet("db").(*sql.DB)

	rows, err := db.Query("SELECT id, url, status, created_at, last_run_at FROM urls ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB query failed"})
		return
	}
	defer rows.Close()

	var urls []URL
	for rows.Next() {
		var u URL
		if err := rows.Scan(&u.ID, &u.URL, &u.Status, &u.CreatedAt, &u.LastRunAt); err == nil {
			urls = append(urls, u)
		}
	}

	c.JSON(http.StatusOK, gin.H{"urls": urls})
}

// POST /api/urls
func AddURL(c *gin.Context) {
	db := c.MustGet("db").(*sql.DB)

	var input struct {
		URL string `json:"url"`
	}

	if err := c.ShouldBindJSON(&input); err != nil || input.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	_, err := db.Exec(
		"INSERT INTO urls (url, status, created_at) VALUES (?, 'queued', ?)",
		input.URL, time.Now(),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert URL"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "URL added"})
}
