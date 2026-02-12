package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// App struct
type App struct {
	ctx    context.Context
	client *http.Client
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		client: &http.Client{
			Timeout: 2 * time.Minute,
		},
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

type HttpResponse struct {
	Status     int               `json:"status"`
	StatusText string            `json:"statusText"`
	Body       string            `json:"body"`
	Headers    map[string]string `json:"headers"`
}

func (a *App) HttpGet(url string, headers map[string]string) (*HttpResponse, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	resp, err := a.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	responseHeaders := map[string]string{}
	for key, values := range resp.Header {
		responseHeaders[key] = strings.Join(values, ",")
	}

	return &HttpResponse{
		Status:     resp.StatusCode,
		StatusText: resp.Status,
		Body:       string(bodyBytes),
		Headers:    responseHeaders,
	}, nil
}

func (a *App) HttpPost(url string, body string, headers map[string]string) (*HttpResponse, error) {

	req, err := http.NewRequest(http.MethodPost, url, strings.NewReader(body))
	if err != nil {
		return nil, err
	}

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	if req.Header.Get("Content-Type") == "" {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := a.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	responseHeaders := map[string]string{}
	for key, values := range resp.Header {
		responseHeaders[key] = strings.Join(values, ",")
	}

	return &HttpResponse{
		Status:     resp.StatusCode,
		StatusText: resp.Status,
		Body:       string(bodyBytes),
		Headers:    responseHeaders,
	}, nil
}
