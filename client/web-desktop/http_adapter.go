package main

import (
	"io"
	"net/http"
	"strings"
	"time"
)

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

	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	resp, err := client.Do(req)
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

	client := &http.Client{
		Timeout: 60 * time.Second,
	}
	resp, err := client.Do(req)
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
