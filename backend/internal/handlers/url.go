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

// POST /api/urls/:id/start
func StartCrawl(c *gin.Context) {
	db := c.MustGet("db").(*sql.DB)
	id := c.Param("id")

	// Update status to running
	res, err := db.Exec("UPDATE urls SET status = 'running', last_run_at = ? WHERE id = ?", time.Now(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		return
	}

	// TODO: trigger actual crawling logic asynchronously here

	c.JSON(http.StatusOK, gin.H{"message": "Crawl started"})
}

// GET /api/urls/:id/status
func GetStatus(c *gin.Context) {
	db := c.MustGet("db").(*sql.DB)
	id := c.Param("id")

	// Get URL status
	var status string
	err := db.QueryRow("SELECT status FROM urls WHERE id = ?", id).Scan(&status)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		return
	}

	// Get crawl results (if any)
	var results struct {
		HTMLVersion   *string `json:"html_version"`
		Title         *string `json:"title"`
		H1Count       *int    `json:"h1_count"`
		H2Count       *int    `json:"h2_count"`
		InternalLinks *int    `json:"internal_links"`
		ExternalLinks *int    `json:"external_links"`
		BrokenLinks   *int    `json:"broken_links"`
		HasLoginForm  *bool   `json:"has_login_form"`
	}

	err = db.QueryRow(`
		SELECT html_version, title, h1_count, h2_count, internal_links, external_links, broken_links, has_login_form
		FROM crawl_results WHERE url_id = ? ORDER BY created_at DESC LIMIT 1
	`, id).Scan(
		&results.HTMLVersion, &results.Title, &results.H1Count, &results.H2Count,
		&results.InternalLinks, &results.ExternalLinks, &results.BrokenLinks, &results.HasLoginForm,
	)

	// Ignore error if no results yet (crawl not done)
	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch crawl results"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  status,
		"results": results,
	})
}

// DELETE /api/urls/:id/delete
func DeleteURL(c *gin.Context) {
	db := c.MustGet("db").(*sql.DB)
	id := c.Param("id")

	res, err := db.Exec("DELETE FROM urls WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete URL"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "URL deleted"})
}
