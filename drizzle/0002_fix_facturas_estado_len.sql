ALTER TABLE "facturas" ALTER COLUMN "estado" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "facturas" ALTER COLUMN "estado" SET DEFAULT 'completada';