package crawler

import (
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gocolly/colly/v2"
)

// CrawlResult holds the result of analysis
type CrawlResult struct {
	HTMLVersion   string
	Title         string
	H1Count       int
	H2Count       int
	InternalLinks int
	ExternalLinks int
	BrokenLinks   int
	HasLoginForm  bool
}

// CrawlURL fetches the page and analyzes it
func CrawlURL(target string) (*CrawlResult, error) {
	u, err := url.Parse(target)
	if err != nil {
		return nil, err
	}

	result := &CrawlResult{}

	// To detect broken links
	brokenCount := 0
	internal := 0
	external := 0

	// Collector setup
	c := colly.NewCollector(
		colly.AllowedDomains(u.Host),
		colly.MaxDepth(1),
	)

	// Parse <title>
	c.OnHTML("title", func(e *colly.HTMLElement) {
		result.Title = strings.TrimSpace(e.Text)
	})

	// Count headings
	c.OnHTML("h1", func(e *colly.HTMLElement) {
		result.H1Count++
	})
	c.OnHTML("h2", func(e *colly.HTMLElement) {
		result.H2Count++
	})

	// Detect login form
	c.OnHTML("input[type='password']", func(e *colly.HTMLElement) {
		result.HasLoginForm = true
	})

	// Count internal/external links and check for broken ones
	c.OnHTML("a[href]", func(e *colly.HTMLElement) {
		href := e.Attr("href")
		link := e.Request.AbsoluteURL(href)
		if link == "" {
			return
		}

		if err != nil {
			return
		}

		if strings.Contains(link, u.Host) {
			internal++
		} else {
			external++
		}

		// Check if link is broken
		go func(link string) {
			client := &http.Client{Timeout: 3 * time.Second}
			resp, err := client.Head(link)
			if err != nil || resp.StatusCode >= 400 {
				brokenCount++
			}
		}(link)
	})

	// Detect HTML version via doctype (manually fetch it)
	resp, err := http.Get(target)
	if err == nil && resp.Body != nil {
		defer resp.Body.Close()
		buf := make([]byte, 1024)
		n, _ := resp.Body.Read(buf)
		html := strings.ToLower(string(buf[:n]))
		if strings.Contains(html, `<!doctype html>`) {
			result.HTMLVersion = "HTML5"
		} else if strings.Contains(html, `<!doctype html public "-//w3c//dtd html 4.01`) {
			result.HTMLVersion = "HTML 4.01"
		} else {
			result.HTMLVersion = "Unknown"
		}
	}

	// Start scraping
	err = c.Visit(target)
	if err != nil {
		return nil, err
	}

	// Give time for go routines to finish
	time.Sleep(1 * time.Second)

	result.InternalLinks = internal
	result.ExternalLinks = external
	result.BrokenLinks = brokenCount

	return result, nil
}
