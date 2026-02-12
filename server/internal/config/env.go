package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

const EnvironmentPrefixMsg = "Environment variable "
const EnvironmentSuffixMsg = " is required."

type Env struct {
	GoEnv             string
	HubShardsQuantity int
	UseLocalTLS       bool
	AppName           string
	AllowedOrigins    []string
	ServerPort        string
	JwtSecret         string
	JwtExpiration     time.Duration
	ContextTimeout    time.Duration
}

var env *Env

func mustExistBool(key string) bool {
	value := os.Getenv(key)

	if value == "" {
		log.Fatal(EnvironmentPrefixMsg + key + EnvironmentSuffixMsg)
	}

	return value == "true"
}

func mustExistInt(key string) int {
	value := os.Getenv(key)

	if value == "" {
		log.Fatal(EnvironmentPrefixMsg + key + EnvironmentSuffixMsg)
	}

	intValue, err := strconv.Atoi(value)
	if err != nil {
		log.Fatalf(EnvironmentPrefixMsg+key+" must be a valid integer: %v", err)
	}

	return intValue
}

func mustExistString(key string) string {
	value := os.Getenv(key)

	if value == "" {
		log.Fatal(EnvironmentPrefixMsg + key + EnvironmentSuffixMsg)
	}

	return value
}

func mustExistStringSlice(key string) []string {
	value := os.Getenv(key)

	if value == "" {
		log.Fatal(EnvironmentPrefixMsg + key + EnvironmentSuffixMsg)
	}

	return strings.Split(value, ",")
}

func mustExistDuration(key string) time.Duration {
	value := os.Getenv(key)

	if value == "" {
		log.Fatal(EnvironmentPrefixMsg + key + EnvironmentSuffixMsg)
	}

	duration, err := time.ParseDuration(value)
	if err != nil {
		log.Fatalf(EnvironmentPrefixMsg+key+" must be a valid duration: %v", err)
	}

	return duration
}

func InitEnv() *Env {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	env = &Env{
		GoEnv:             mustExistString("GO_ENV"),
		HubShardsQuantity: mustExistInt("HUB_SHARDS_QUANTITY"),
		UseLocalTLS:       mustExistBool("USE_LOCAL_TLS"),
		AppName:           mustExistString("APP_NAME"),
		AllowedOrigins:    mustExistStringSlice("ALLOWED_ORIGINS"),
		ServerPort:        mustExistString("SERVER_PORT"),
		JwtSecret:         mustExistString("JWT_SECRET"),
		JwtExpiration:     mustExistDuration("JWT_EXPIRATION"),
		ContextTimeout:    mustExistDuration("CONTEXT_TIMEOUT"),
	}

	log.Println("Environment variables initialized successfully")

	return env
}

func GetEnv() *Env {
	if env == nil {
		log.Fatal("env not initialized, call InitEnv first")
	}

	return env
}
