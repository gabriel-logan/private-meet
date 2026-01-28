# Makefile for Go project

.PHONY: run build test tidy clean

run:
	cd server && go run main.go

build:
	cd server && go build -o bin/server main.go
	cd web && pnpm install && pnpm build

install:
	cd server && go install
	cd web && pnpm install

test:
	cd server && go test ./...

tidy:
	cd server && go mod tidy

clean:
	cd server && go clean
	rm -rf server/bin
	rm -rf web/dist
