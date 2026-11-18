ALTER TABLE "orders" ADD COLUMN "courier_waybill" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "courier_status" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "courier_error" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "courier_updated_at" timestamp with time zone;