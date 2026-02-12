package main

import (
	"context"
	"errors"
	"testing"

	"github.com/wailsapp/wails/v2/pkg/options"
)

func TestAppStartupAndGreet(t *testing.T) {
	app := NewApp()

	if app == nil {
		t.Fatalf("expected NewApp() to return non-nil")
	}

	ctx := context.WithValue(context.Background(), "k", "v")
	app.startup(ctx)

	if app.ctx != ctx {
		t.Fatalf("expected startup to store ctx")
	}

	got := app.Greet("Logan")
	want := "Hello Logan, It's show time!"

	if got != want {
		t.Fatalf("expected %q, got %q", want, got)
	}
}

func TestMainRunSuccess(t *testing.T) {
	orig := wailsRun
	defer func() { wailsRun = orig }()

	called := false
	wailsRun = func(app *options.App) error {
		called = true

		if app == nil {
			t.Fatalf("expected options.App, got nil")
		}

		if app.Title != "Private Meet" {
			t.Fatalf("expected Title Private Meet, got %q", app.Title)
		}

		if app.OnStartup == nil {
			t.Fatalf("expected OnStartup to be set")
		}

		if len(app.Bind) != 1 {
			t.Fatalf("expected 1 bound object, got %d", len(app.Bind))
		}

		return nil
	}

	main()
	if !called {
		t.Fatalf("expected wailsRun to be called")
	}
}

func TestMainRunError(t *testing.T) {
	orig := wailsRun
	defer func() { wailsRun = orig }()

	wailsRun = func(app *options.App) error {
		return errors.New("boom")
	}

	// We don't assert output; just cover the error branch.
	main()
}
