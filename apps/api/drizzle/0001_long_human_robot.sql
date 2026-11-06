CREATE TABLE "service_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"customer_name" varchar(100) NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(20) DEFAULT 'NEW',
	"created_at" timestamp with time zone DEFAULT now()
);
