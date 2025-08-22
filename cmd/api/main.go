package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/go-chi/chi"
	"github.com/ialekseychuk/my-place/internal/repository"
	"github.com/ialekseychuk/my-place/internal/server/handlers"
	"github.com/ialekseychuk/my-place/internal/usecase"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	_ = godotenv.Load()
	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	db, err := pgxpool.New(context.Background(), os.Getenv("POSTGRES_DSN"))
	if err != nil {
		logger.Fatal("error connecting to db", zap.Error(err))
	}
	defer db.Close()
	// repos
	businesRepo := repository.NewBusinessRepository(db)
	serviceRepo := repository.NewServiceRepository(db)
	staffRepo := repository.NewStaffRepository(db)
	bookingRepo := repository.NewBookingRepository(db)

	// usecases
	ucBusines := usecase.NewBusinessUseCase(businesRepo)
	ucBooking := usecase.NewBookingUseCase(bookingRepo, serviceRepo, staffRepo)
	ucService := usecase.NewServiceUseCase(serviceRepo)

	//handlers
	bh := handlers.NewBusinessHandler(ucBusines)
	ah := handlers.NewAvailabilityHandler(ucBooking)
	sh := handlers.NewServiceHandler(ucService)

	r := chi.NewRouter()

	r.Route("/api/v1", func(apiRouter chi.Router) {
		apiRouter.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("api running"))
		})
		apiRouter.Route("/businesses", func(businesRouter chi.Router) {
			businesRouter.Mount("", bh.Routes())
			businesRouter.Route("/{businessID}", func(businesIDRouter chi.Router) {
				businesIDRouter.Get("/businesses/{businessID}/availability", ah.Routes().ServeHTTP)
				businesIDRouter.Mount("/services", sh.Routes())
			})
		})

	})

	port := os.Getenv("APP_HTTP_PORT")

	if port == "" {
		port = "81"
	}

	svr := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		logger.Info("starting server", zap.String("address", svr.Addr))
		err := svr.ListenAndServe()
		if err != nil {
			logger.Error("error starting server", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit
	logger.Info("shutting down server")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := svr.Shutdown(ctx); err != nil {
		logger.Fatal("error shutting down server", zap.Error(err))
	}

}
