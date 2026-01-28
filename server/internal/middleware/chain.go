package middleware

import "net/http"

type Middleware func(http.Handler) http.Handler

func Chain(middlewares ...Middleware) Middleware {
	return func(final http.Handler) http.Handler {
		wrapped := final
		for i := len(middlewares) - 1; i >= 0; i-- {
			wrapped = middlewares[i](wrapped)
		}
		return wrapped
	}
}

func Apply(h http.Handler, middlewares ...Middleware) http.Handler {
	return Chain(middlewares...)(h)
}
