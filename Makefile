# Makefile for Go project

.PHONY: run_server run_web build test tidy clean

run_web:
	cd client/web-desktop/frontend && pnpm dev

run_server:
	cd server && go run ./cmd/api/main.go

build:
	cd server && go build -o bin/server ./cmd/api/main.go
	cd client/web-desktop/frontend && pnpm install && pnpm build

build_desktop:
	cd client && wails build -clean -race

build_desktop_install:
	cd client && wails build -nsis -clean -race

install:
	cd server && go mod download
	cd client/web-desktop/frontend && pnpm install

test:
	cd server && go test $$(go list ./... | grep -v /cmd/)

test_cov:
	cd server && go test $$(go list ./... | grep -v /cmd/) -cover

test_cov_html:
	cd server && go test ./... -coverprofile=coverage.out && go tool cover -html=coverage.out

test_race:
	cd server && go test --race $$(go list ./... | grep -v /cmd/)

tidy:
	cd server && go mod tidy

clean:
	cd server && go clean
	rm -rf server/bin
	rm -rf client/web-desktop/frontend/dist
