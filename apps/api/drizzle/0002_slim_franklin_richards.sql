ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "service_requests" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "service_requests" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_status_check" CHECK ("service_requests"."status" IN ('NEW'));