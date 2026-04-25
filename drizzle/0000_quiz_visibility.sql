CREATE TYPE "public"."quiz_visibility" AS ENUM('SHARED', 'PRIVATE');--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "visibility" "quiz_visibility" DEFAULT 'SHARED' NOT NULL;
