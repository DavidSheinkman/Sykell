package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
)

func main() {
	dsn := "user:pass@tcp(db:3306)/crawler?parseTime=true"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal("Cannot connect to DB:", err)
	}
	fmt.Println("✅ Connected to MySQL!")

	r := gin.Default()

	// Example route to test API
	r.GET("/api/urls", func(c *gin.Context) {
		// Just return dummy data for now
		c.JSON(http.StatusOK, gin.H{
			"urls": []string{"https://example.com", "https://openai.com"},
		})
	})

	// Start server on port 8080
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to run server:", err)
	}
}
