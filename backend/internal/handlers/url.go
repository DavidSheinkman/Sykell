package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/DavidSheinkman/GoStudy/internal/crawler"
	"github.com/gin-gonic/gin"
)

// URL represents the DB model
type URL struct {
	ID        int     `json:"id"`
	URL       string  `json:"url"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"created_at"`
	LastRunAt *string `json:"last_run_at"`
	Title     *string `json:"title"`
}

// GET /api/urls
func GetURLs(c *gin.Context) {
	db := c.MustGet("db").(*sql.DB)

	rows, err := db.Query(`
		SELECT u.id, u.url, u.status, u.created_at, u.last_run_at, cr.title
		FROM urls u
		LEFT JOIN (
			SELECT url_id, title
			FROM crawl_results
			WHERE created_at = (
				SELECT MAX(created_at) FROM crawl_results cr2 WHERE cr2.url_id = crawl_results.url_id
			)
		) cr ON u.id = cr.url_id
		ORDER BY u.created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB query failed"})
		return
	}
	defer rows.Close()

	var urls []URL
	for rows.Next() {
		var u URL
		if err := rows.Scan(&u.ID, &u.URL, &u.Status, &u.CreatedAt, &u.LastRunAt, &u.Title); err == nil {
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

	// Fetch the URL
	var target string
	if err := db.QueryRow("SELECT url FROM urls WHERE id = ?", id).Scan(&target); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		return
	}

	// Mark running
	db.Exec("UPDATE urls SET status = 'running', last_run_at = ? WHERE id = ?", time.Now(), id)

	// Launch async crawl, passing db and params
	go func(db *sql.DB, urlID, targetURL string) {
		result, err := crawler.CrawlURL(targetURL)
		if err != nil {
			log.Println("Crawl error:", err)
			db.Exec("UPDATE urls SET status = 'error' WHERE id = ?", urlID)
			return
		}

		// Insert into crawl_results
		res, err := db.Exec(`
			INSERT INTO crawl_results
				(url_id, html_version, title, h1_count, h2_count, internal_links, external_links, broken_links, has_login_form, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, urlID, result.HTMLVersion, result.Title, result.H1Count, result.H2Count,
			result.InternalLinks, result.ExternalLinks, result.BrokenLinks, result.HasLoginForm, time.Now())
		if err != nil {
			log.Println("DB insert error:", err)
			db.Exec("UPDATE urls SET status = 'error' WHERE id = ?", urlID)
			return
		}

		// Get the insert ID
		crawlResultID, err := res.LastInsertId()
		if err != nil {
			log.Println("Failed to read crawl_result ID:", err)
		}

		// Insert broken-link details
		for _, bl := range result.BrokenLinksList {
			if _, err := db.Exec(`
				INSERT INTO broken_link_details (crawl_result_id, url, status_code)
				VALUES (?, ?, ?)
			`, crawlResultID, bl.URL, bl.StatusCode); err != nil {
				log.Println("Broken link insert error:", err)
			}
		}

		// Mark done
		db.Exec("UPDATE urls SET status = 'done' WHERE id = ?", urlID)
	}(db, id, target)

	c.JSON(http.StatusOK, gin.H{"message": "Crawl started"})
}

// GET /api/urls/:id/status
func GetStatus(c *gin.Context) {
	db := c.MustGet("db").(*sql.DB)
	id := c.Param("id")

	// URL status
	var status string
	if err := db.QueryRow("SELECT status FROM urls WHERE id = ?", id).Scan(&status); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		return
	}

	// Crawl results
	var results struct {
		HTMLVersion   *string `json:"html_version"`
		Title         *string `json:"title"`
		H1Count       *int    `json:"h1_count"`
		H2Count       *int    `json:"h2_count"`
		InternalLinks *int    `json:"internal_links"`
		ExternalLinks *int    `json:"external_links"`
		BrokenLinks   *int    `json:"broken_links"`
		HasLoginForm  *bool   `json:"has_login_form"`
		BrokenDetails []struct {
			URL        string `json:"url"`
			StatusCode int    `json:"status_code"`
		} `json:"broken_details"`
	}

	// Fetch main results row
	err := db.QueryRow(`
		SELECT html_version, title, h1_count, h2_count, internal_links, external_links, broken_links, has_login_form
		FROM crawl_results WHERE url_id = ? ORDER BY created_at DESC LIMIT 1
	`, id).Scan(
		&results.HTMLVersion, &results.Title, &results.H1Count, &results.H2Count,
		&results.InternalLinks, &results.ExternalLinks, &results.BrokenLinks, &results.HasLoginForm,
	)
	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch crawl results"})
		return
	}

	// Fetch broken-link details
	rows, err := db.Query(`
		SELECT url, status_code
		FROM broken_link_details
		WHERE crawl_result_id = (
			SELECT id FROM crawl_results WHERE url_id = ? ORDER BY created_at DESC LIMIT 1
		)
	`, id)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var bl struct {
				URL        string `json:"url"`
				StatusCode int    `json:"status_code"`
			}
			if err := rows.Scan(&bl.URL, &bl.StatusCode); err == nil {
				results.BrokenDetails = append(results.BrokenDetails, bl)
			}
		}
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
	if rows, _ := res.RowsAffected(); rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "URL deleted"})
}
