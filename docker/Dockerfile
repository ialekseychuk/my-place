FROM golang:1.25-alpine AS build

WORKDIR /app

COPY . .

ENV CGO_ENABLED=0
ENV GOOS=linux

RUN go build -o main cmd/api/main.go

FROM alpine:3.18

RUN apk add --no-cache tzdata
COPY --from=build /app/main /app/bin/main
COPY .env /app/bin/.env

# COPY --from=build /usr/share/zoneinfo /usr/share/zoneinfo

WORKDIR /app/bin

EXPOSE 81

CMD ["./main"]