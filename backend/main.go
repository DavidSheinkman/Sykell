package main

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/DavidSheinkman/GoStudy/internal/handlers"
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

	r.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Next()
	})

	r.GET("/api/urls", handlers.GetURLs)
	r.POST("/api/urls", handlers.AddURL)

	// Start server on port 8080
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to run server:", err)
	}
}
