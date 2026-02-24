package handlers

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func ensureTestDist(t *testing.T) string {
	t.Helper()

	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to getwd: %v", err)
	}

	dist := filepath.Clean(filepath.Join(wd, "..", "client", "web-desktop", "frontend", "dist"))

	if err := os.MkdirAll(filepath.Join(dist, "assets"), 0o755); err != nil {
		t.Fatalf("failed to create dist: %v", err)
	}

	if err := os.WriteFile(filepath.Join(dist, "index.html"), []byte("INDEX"), 0o600); err != nil {
		t.Fatalf("failed to write index.html: %v", err)
	}

	if err := os.WriteFile(filepath.Join(dist, "assets", "app.js"), []byte("console.log('ok')"), 0o600); err != nil {
		t.Fatalf("failed to write asset: %v", err)
	}

	t.Cleanup(func() {
		_ = os.RemoveAll(filepath.Clean(filepath.Join(wd, "..", "client", "web-desktop", "frontend", "dist")))
	})

	return dist
}

func TestServeSPAIndexFallback(t *testing.T) {
	_ = ensureTestDist(t)

	req := httptest.NewRequest(http.MethodGet, "http://example.test/", nil)
	rec := httptest.NewRecorder()

	ServeSPA(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if got := rec.Body.String(); got != "INDEX" {
		t.Fatalf("expected INDEX body, got %q", got)
	}
}

func TestServeSPAServesAsset(t *testing.T) {
	_ = ensureTestDist(t)

	req := httptest.NewRequest(http.MethodGet, "http://example.test/assets/app.js", nil)
	rec := httptest.NewRecorder()

	ServeSPA(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if got := rec.Body.String(); got == "" {
		t.Fatalf("expected non-empty asset body")
	}
}

func TestServeSPABlocksTraversal(t *testing.T) {
	_ = ensureTestDist(t)

	req := httptest.NewRequest(http.MethodGet, "http://example.test/../../etc/passwd", nil)
	req.URL.Path = "../../../../etc/passwd"
	rec := httptest.NewRecorder()

	ServeSPA(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestServeSPAWhenAbsFails(t *testing.T) {
	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to getwd: %v", err)
	}

	tmp := t.TempDir()
	brokenCwd := filepath.Join(tmp, "gone")
	if err := os.MkdirAll(brokenCwd, 0o755); err != nil {
		t.Fatalf("failed to create dir: %v", err)
	}
	if err := os.Chdir(brokenCwd); err != nil {
		t.Fatalf("failed to chdir: %v", err)
	}
	if err := os.RemoveAll(brokenCwd); err != nil {
		t.Fatalf("failed to remove dir: %v", err)
	}
	t.Cleanup(func() {
		_ = os.Chdir(wd)
	})

	req := httptest.NewRequest(http.MethodGet, "http://example.test/", nil)
	rec := httptest.NewRecorder()

	ServeSPA(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rec.Code)
	}
}
