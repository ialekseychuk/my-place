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
// @BasePath http://localhost:81
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
	userRepo := repository.NewUserRepository(db)
	workingHoursRepo := repository.NewBusinessWorkingHoursRepository(db)
	serviceRepo := repository.NewServiceRepository(db)
	staffRepo := repository.NewStaffRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	staffServiceRepo := repository.NewStaffServiceRepository(db)
	scheduleRepo := repository.NewScheduleRepository(db)
	clientRepo := repository.NewClientRepository(db)
	locationRepo := repository.NewLocationRepository(db)

	// usecases
	ucBusines := usecase.NewBusinessUseCase(businesRepo, locationRepo, userRepo, workingHoursRepo)
	authService := usecase.NewAuthService(userRepo, os.Getenv("JWT_SECRET"))

	ucService := usecase.NewServiceUseCase(serviceRepo)
	ucStaff := usecase.NewStaffUseCase(staffRepo, staffServiceRepo, serviceRepo)
	ucBooking := usecase.NewBookingService(bookingRepo, serviceRepo, staffRepo, clientRepo) 
	scheduleService := usecase.NewScheduleService(scheduleRepo, staffRepo)
	clientService := usecase.NewClientService(clientRepo)
	locationService := usecase.NewLocationService(locationRepo)

	//handlers

	bh := handlers.NewBusinessHandler(ucBusines)
	authHandler := handlers.NewAuthHandler(authService)

	sh := handlers.NewServiceHandler(ucService)
	sth := handlers.NewStaffHandler(ucStaff)
	stsh := handlers.NewStaffServiceHandler(ucStaff)
	bkh := handlers.NewBookingHandler(ucBooking)
	scheduleHandler := handlers.NewScheduleHandler(scheduleService)
	clientHandler := handlers.NewClientHandler(clientService)
	locationHandler := handlers.NewLocationHandler(locationService) 

	r := chi.NewRouter()
	r.Use(middleware.Logger(logger))
	r.Use(middleware.CORS) // Add CORS middleware

	// JWT middleware
	jwtMiddleware := middleware.JWTMiddleware(authService)

	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/docs/swagger.json"),
	))

	r.Get("/docs/swagger.json", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./docs/openapi3.json")
	})

	r.Route("/api/v1", func(v1 chi.Router) {
		v1.Use(middleware.JsonResponse)

		// Debug endpoint to verify routing
		v1.Get("/debug", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("debug endpoint reached"))
		})

		// Public routes
		v1.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("api running"))
		})
		v1.Post("/businesses/register", bh.RegisterBusiness)
		v1.Mount("/auth", authHandler.Routes())

		// Protected routes
		v1.Group(func(protected chi.Router) {
			protected.Use(jwtMiddleware)

			protected.Route("/businesses", func(br chi.Router) {
				br.Post("/", bh.CreateBusiness)

				// Debug endpoint for businesses
				br.Get("/debug", func(w http.ResponseWriter, r *http.Request) {
					w.Write([]byte("business debug endpoint reached"))
				})

				br.Route("/{businessID}", func(bir chi.Router) {
					// Debug endpoint for specific business
					bir.Get("/debug", func(w http.ResponseWriter, r *http.Request) {
						businessID := chi.URLParam(r, "businessID")
						w.Write([]byte("business " + businessID + " debug endpoint reached"))
					})

					// Business owner only routes
					bir.Group(func(owner chi.Router) {
						owner.Use(middleware.RequireRole("owner"))
						owner.Get("/", bh.GetBusiness)
						owner.Mount("/locations", locationHandler.Routes())
						owner.Mount("/services", sh.Routes())
						owner.Mount("/staff-services", stsh.Routes())
						owner.Mount("/schedule", scheduleHandler.Routes())
						owner.Mount("/clients", clientHandler.Routes())
					})

				
					bir.Group(func(staff chi.Router) {
						staff.Use(middleware.RequireAnyRole("owner", "staff"))
						staff.Mount("/bookings", bkh.Routes())
						staff.Mount("/staffs", sth.Routes())
					})
				})
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
