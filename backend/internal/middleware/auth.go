package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const AuthToken = "supersecrettoken"

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")

		if !strings.HasPrefix(auth, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing or malformed token"})
			return
		}

		token := strings.TrimPrefix(auth, "Bearer ")
		if token != AuthToken {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		c.Next()
	}
}
