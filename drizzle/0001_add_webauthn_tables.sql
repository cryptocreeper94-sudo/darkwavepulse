-- Migration: Add WebAuthn tables for biometric authentication
-- Version: 1.21.0
-- Date: 2025-12-17

-- Create webauthn_challenges table if it doesn't exist
CREATE TABLE IF NOT EXISTS "webauthn_challenges" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"challenge" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create webauthn_credentials table if it doesn't exist
CREATE TABLE IF NOT EXISTS "webauthn_credentials" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" varchar(50),
	"transports" text,
	"aaguid" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "webauthn_credentials_credential_id_unique" UNIQUE("credential_id")
);
