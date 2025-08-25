package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/ialekseychuk/my-place/internal/repository"
	"github.com/ialekseychuk/my-place/internal/server/handlers"
	"github.com/ialekseychuk/my-place/internal/server/middleware"
	"github.com/ialekseychuk/my-place/internal/usecase"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger"
	"go.uber.org/zap"
)

// @title MyPlace API
// @version 1.0
// @description This is a sample API with OpenAPI documentation.
// @host localhost:81
// @BasePath /api
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

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

	ucService := usecase.NewServiceUseCase(serviceRepo)
	ucStaff := usecase.NewStaffUseCase(staffRepo)
	ucBooking := usecase.NewBookingService(bookingRepo, serviceRepo, staffRepo)

	//handlers

	bh := handlers.NewBusinessHandler(ucBusines)

	sh := handlers.NewServiceHandler(ucService)
	sth := handlers.NewStaffHandler(ucStaff)
	bkh := handlers.NewBookingHandler(ucBooking)

	r := chi.NewRouter()
	r.Use(middleware.Logger(logger))

	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/docs/swagger.json"),
	))

	r.Get("/docs/swagger.json", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./docs/openapi3.json")
	})

	r.Route("/api/v1", func(v1 chi.Router) {
		v1.Use(middleware.JsonResponse)

		v1.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("api running"))
		})

		v1.Route("/businesses", func(br chi.Router) {
			br.Post("/", bh.CreateBusiness)

			br.Route("/{businessID}", func(bir chi.Router) {
				// Business-specific routes (without additional path)
				bir.Get("/", bh.GetBusiness)

				// Resource routes
				bir.Mount("/services", sh.Routes())
				bir.Mount("/staffs", sth.Routes())
				bir.Mount("/bookings", bkh.Routes())
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
