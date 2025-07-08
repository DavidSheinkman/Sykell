package main

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"database/sql"
	"fmt"
	"log"

	"github.com/DavidSheinkman/GoStudy/internal/handlers"
	"github.com/DavidSheinkman/GoStudy/internal/middleware"

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

	// ✅ 1. CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "DELETE", "PUT", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ✅ 2. DB context
	r.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Next()
	})

	// ✅ 3. Auth middleware
	r.Use(middleware.AuthRequired())

	// ✅ 4. Routes
	r.GET("/api/urls", handlers.GetURLs)
	r.POST("/api/urls", handlers.AddURL)
	r.POST("/api/urls/:id/start", handlers.StartCrawl)
	r.GET("/api/urls/:id/status", handlers.GetStatus)
	r.DELETE("/api/urls/:id/delete", handlers.DeleteURL)

	// ✅ 5. Start server
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to run server:", err)
	}
}
