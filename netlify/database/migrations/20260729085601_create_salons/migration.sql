CREATE TABLE "salons" (
	"id" serial PRIMARY KEY,
	"owner_id" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"business_type" text NOT NULL,
	"team_size" text NOT NULL,
	"city" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"services" jsonb NOT NULL,
	"brand_tone" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
