package main

import (
	"go/ast"
	"go/parser"
	"go/token"
	"path/filepath"
	"testing"
)

func TestMainFunctionExists(t *testing.T) {
	path := filepath.Join(".", "main.go")

	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, path, nil, 0)
	if err != nil {
		t.Fatalf("failed to parse main.go: %v", err)
	}

	found := false
	for _, decl := range file.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if !ok {
			continue
		}
		if fn.Name != nil && fn.Name.Name == "main" {
			found = true
			break
		}
	}

	if !found {
		t.Fatalf("expected to find func main")
	}
}
