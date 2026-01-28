package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

const EnvironmentPrefixMsg = "Environment variable "

type Env struct {
	ServerPort     string
	JwtSecret      string
	JwtExpiration  time.Duration
	ContextTimeout time.Duration
}

var env *Env

func mustExistString(key string) string {
	value := os.Getenv(key)

	if value == "" {
		log.Fatal(EnvironmentPrefixMsg + key + " is required")
	}

	return value
}

func mustExistDuration(key string) time.Duration {
	value := os.Getenv(key)

	if value == "" {
		log.Fatal(EnvironmentPrefixMsg + key + " is required")
	}

	duration, err := time.ParseDuration(value)
	if err != nil {
		log.Fatalf(EnvironmentPrefixMsg+key+" must be a valid duration: %v", err)
	}

	return duration
}

func InitEnv() *Env {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	env = &Env{
		ServerPort:     mustExistString("SERVER_PORT"),
		JwtSecret:      mustExistString("JWT_SECRET"),
		JwtExpiration:  mustExistDuration("JWT_EXPIRATION"),
		ContextTimeout: mustExistDuration("CONTEXT_TIMEOUT"),
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
