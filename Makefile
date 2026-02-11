# Makefile for Go project

.PHONY: run_server run_web build test tidy clean

run_web:
	cd web && pnpm dev

run_server:
	cd server && go run ./cmd/api/main.go

build:
	cd server && go build -o bin/server ./cmd/api/main.go
	cd web && pnpm install && pnpm build

install:
	cd server && go install
	cd web && pnpm install

test:
	cd server && go test ./...

test_cov:
	cd server && go test ./... -cover

test_cov_html:
	cd server && go test ./... -coverprofile=coverage.out && go tool cover -html=coverage.out

test_race:
	cd server && go test --race ./...

tidy:
	cd server && go mod tidy

clean:
	cd server && go clean
	rm -rf server/bin
	rm -rf web/dist
