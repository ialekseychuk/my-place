package grpcclient

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/backoff"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
)

type Params struct {
	Target string
	Logger *zap.Logger
}

func New[T any](p Params, fn func(*grpc.ClientConn) T) (client T, conn *grpc.ClientConn, cleanup func(), err error) {
	p.Logger.Info("Creating gRPC client", zap.String("target", p.Target))

	conn, err = grpc.NewClient(
		p.Target,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithConnectParams(grpc.ConnectParams{
			Backoff:           backoff.DefaultConfig,
			MinConnectTimeout: 10 * time.Second,
		}),
		grpc.WithKeepaliveParams(keepalive.ClientParameters{
			Time:                30 * time.Second,
			Timeout:             10 * time.Second,
			PermitWithoutStream: true,
		}),
		grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy":"round_robin"}`),
		grpc.WithDefaultServiceConfig(`{
            "retryPolicy": {
                "maxAttempts": 4,
                "initialBackoff": "0.2s",
                "maxBackoff": "2s",
                "backoffMultiplier": 1.5,
                "retryableStatusCodes": [ "UNAVAILABLE", "RESOURCE_EXHAUSTED" ]
            }
        }`),
		grpc.WithChainUnaryInterceptor(
			loggingInterceptor(p.Logger),
			retryInterceptor(),
		),
	)
	if err != nil {
		p.Logger.Error("Failed to create gRPC client connection", zap.Error(err), zap.String("target", p.Target))
		return client, nil, nil, fmt.Errorf("create client: %w", err)
	}
	
	p.Logger.Info("Successfully created gRPC client connection", zap.String("target", p.Target))

	client = fn(conn)
	cleanup = func() { 
		p.Logger.Info("Closing gRPC client connection", zap.String("target", p.Target))
		_ = conn.Close() 
	}
	return client, conn, cleanup, nil
}

func loggingInterceptor(log *zap.Logger) grpc.UnaryClientInterceptor {
	return func(ctx context.Context, method string, req, reply any, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		// Log the request details
		log.Info("grpc call", 
			zap.String("method", method),
			zap.Any("request", req))
		
		err := invoker(ctx, method, req, reply, cc, opts...)
		if err != nil {
			log.Error("grpc error", 
				zap.Error(err), 
				zap.String("method", method),
				zap.Any("request", req))
		} else {
			log.Info("grpc success", 
				zap.String("method", method),
				zap.Any("response", reply))
		}
		return err
	}
}

func retryInterceptor() grpc.UnaryClientInterceptor {
	return func(ctx context.Context, method string, req, reply any, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		var lastErr error
		for attempt := 0; attempt < 3; attempt++ {
			lastErr = invoker(ctx, method, req, reply, cc, opts...)
			if lastErr == nil {
				return nil
			}
			// Add a small delay between retries
			time.Sleep(time.Duration(attempt+1) * 100 * time.Millisecond)
		}
		return lastErr
	}
}
