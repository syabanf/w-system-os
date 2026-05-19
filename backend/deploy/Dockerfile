# Multi-stage build. `--build-arg SERVICE=hr-service` picks which cmd binary.
FROM golang:1.22-alpine AS build
ARG SERVICE=api-gateway
WORKDIR /src
RUN apk add --no-cache git
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/service ./cmd/${SERVICE}

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=build /out/service /app/service
COPY migrations /app/migrations
EXPOSE 8080
ENTRYPOINT ["/app/service"]
