package main

import (
	"net/http"
	"os"

	"github.com/go-chi/chi"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	_ = godotenv.Load()
	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	r := chi.NewRouter()
	r.Get("/", func (w http.ResponseWriter, r *http.Request)  {
		w.Write([]byte("api running"))
	})


	port := os.Getenv("APP_HTTP_PORT")
	
	if port == "" {
		port = "8080"
	}
	logger.Info("starting server", zap.String("port", port))
	err := http.ListenAndServe(":"+port, r)
	if err != nil {
		logger.Error("error starting server", zap.Error(err))
	}
	
}