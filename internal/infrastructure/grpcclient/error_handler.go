package grpcclient

import (
	"net/http"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func GRPCErrorToHttp(err error) (int, string) {
	st, ok := status.FromError(err)
	if !ok {
		return http.StatusInternalServerError, "Internal Server Error"
	}

	switch st.Code() {
	case codes.InvalidArgument:
		return http.StatusBadRequest, st.Message()
	case codes.NotFound:
		return http.StatusNotFound, st.Message()
	case codes.AlreadyExists:
		return http.StatusConflict, st.Message()
	case codes.PermissionDenied:
		return http.StatusForbidden, st.Message()
	case codes.Unauthenticated:
		return http.StatusUnauthorized, st.Message()
	case codes.FailedPrecondition:
		return http.StatusPreconditionFailed, st.Message()
	case codes.Unavailable:
		return http.StatusServiceUnavailable, "Service temporarily unavailable"
	case codes.DeadlineExceeded:
		return http.StatusGatewayTimeout, "Request timeout"
	default:
		return http.StatusInternalServerError, "Internal server error"
	}
}
