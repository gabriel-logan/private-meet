package security

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func ValidateJWT(token string) (*jwt.RegisteredClaims, error) {
	secretKey := os.Getenv("JWT_SECRET")

	claims := &jwt.RegisteredClaims{}

	parsedToken, err := jwt.ParseWithClaims(
		token,
		claims,
		func(token *jwt.Token) (interface{}, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, jwt.ErrTokenSignatureInvalid
			}

			return []byte(secretKey), nil
		},
		jwt.WithLeeway(2*time.Minute),
	)
	if err != nil {
		return nil, err
	}

	if !parsedToken.Valid {
		return nil, jwt.ErrTokenInvalidClaims
	}

	if claims.ExpiresAt == nil || claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, jwt.ErrTokenExpired
	}

	if claims.IssuedAt == nil || claims.IssuedAt.Time.After(time.Now()) {
		return nil, jwt.ErrTokenInvalidClaims
	}

	return claims, nil
}

func GenerateJWT(userID string) (string, error) {
	secretKey := os.Getenv("JWT_SECRET")
	expiration := os.Getenv("JWT_EXPIRATION")

	parsedExpiration, err := time.ParseDuration(expiration)
	if err != nil {
		parsedExpiration = 12 * time.Hour
	}

	claims := &jwt.RegisteredClaims{
		Subject:   userID,
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ExpiresAt: jwt.NewNumericDate(GenerateJwtExpirationTime(parsedExpiration)),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	signedToken, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return signedToken, nil
}

/*
  - expiration: duration string, e.g., "24h", "30m"
  - GenerateExpirationTime generates a time.Time object representing the expiration time
    based on the provided duration string. If the duration string is invalid, it defaults to 24 hours from the current time.
*/
func GenerateJwtExpirationTime(expiration time.Duration) time.Time {
	if expiration == 0 {
		expiration = 12 * time.Hour
	}

	return time.Now().Add(expiration)
}
