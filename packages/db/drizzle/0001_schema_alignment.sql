-- Phase 1: Schema alignment with PRD
-- This migration aligns all tables with the PRD data model specification.

-- New enums
DO $$ BEGIN
  CREATE TYPE "project_status" AS ENUM ('active', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "stage" AS ENUM ('requirements', 'prd', 'planning', 'development', 'review', 'qa', 'deploy', 'retro');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Fix artifact_status enum: rename 'active' to 'current'
ALTER TYPE "artifact_status" RENAME VALUE 'active' TO 'current';

-- Fix artifact_type enum: rename values to match PRD
ALTER TYPE "artifact_type" RENAME VALUE 'code-review' TO 'review';
ALTER TYPE "artifact_type" RENAME VALUE 'qa-report' TO 'test-report';
ALTER TYPE "artifact_type" RENAME VALUE 'deploy-log' TO 'deploy-record';

-- Fix story_status enum: rename 'in-progress' to 'in_progress'
ALTER TYPE "story_status" RENAME VALUE 'in-progress' TO 'in_progress';

-- Project table: add missing columns
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "default_branch" text NOT NULL DEFAULT 'main';
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "status" "project_status" NOT NULL DEFAULT 'active';
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();

-- Sprint table: add missing columns
ALTER TABLE "sprint" ADD COLUMN IF NOT EXISTS "goal" text;
ALTER TABLE "sprint" ADD COLUMN IF NOT EXISTS "pr_url" text;
ALTER TABLE "sprint" ADD COLUMN IF NOT EXISTS "deploy_url" text;

-- Story table: add missing columns, rename order -> sort_order
ALTER TABLE "story" ADD COLUMN IF NOT EXISTS "points" integer;
ALTER TABLE "story" ADD COLUMN IF NOT EXISTS "acceptance_criteria" text;
ALTER TABLE "story" RENAME COLUMN "order" TO "sort_order";

-- AgentTask table: add missing columns, make sprintId nullable
ALTER TABLE "agent_task" ADD COLUMN IF NOT EXISTS "project_id" text;
ALTER TABLE "agent_task" ADD COLUMN IF NOT EXISTS "stage" "stage";
ALTER TABLE "agent_task" ADD COLUMN IF NOT EXISTS "started_at" timestamp;
ALTER TABLE "agent_task" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;
ALTER TABLE "agent_task" ALTER COLUMN "sprint_id" DROP NOT NULL;
ALTER TABLE "agent_task" ALTER COLUMN "tokens_budget" SET DEFAULT 100000;

-- Backfill project_id from sprint -> project for existing tasks
UPDATE "agent_task" SET "project_id" = (
  SELECT "project_id" FROM "sprint" WHERE "sprint"."id" = "agent_task"."sprint_id"
) WHERE "project_id" IS NULL AND "sprint_id" IS NOT NULL;

-- Backfill stage for existing tasks that have no stage set
UPDATE "agent_task" SET "stage" = 'development' WHERE "stage" IS NULL;

-- Now make project_id and stage NOT NULL (after backfill)
-- Note: if there are rows without sprint_id, they'll need manual fixing
ALTER TABLE "agent_task" ALTER COLUMN "project_id" SET NOT NULL;
ALTER TABLE "agent_task" ALTER COLUMN "stage" SET NOT NULL;

-- Add FK constraint for project_id
ALTER TABLE "agent_task" ADD CONSTRAINT "agent_task_project_id_project_id_fk"
  FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;

-- Make session_id unique
ALTER TABLE "agent_task" ADD CONSTRAINT "agent_task_session_id_unique" UNIQUE ("session_id");

-- Artifact table: add missing columns, make sprint_id nullable
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "project_id" text;
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "commit_sha" text;
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "artifact" ALTER COLUMN "sprint_id" DROP NOT NULL;

-- Backfill artifact project_id from agent_task
UPDATE "artifact" SET "project_id" = (
  SELECT "project_id" FROM "agent_task" WHERE "agent_task"."id" = "artifact"."agent_task_id"
) WHERE "project_id" IS NULL;

-- Make project_id NOT NULL after backfill
ALTER TABLE "artifact" ALTER COLUMN "project_id" SET NOT NULL;
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_project_id_project_id_fk"
  FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;

-- Conversation table: restructure completely
-- Step 1: Add new columns as nullable first
ALTER TABLE "conversation" ADD COLUMN IF NOT EXISTS "project_id" text;
ALTER TABLE "conversation" ADD COLUMN IF NOT EXISTS "sprint_id" text;
ALTER TABLE "conversation" ADD COLUMN IF NOT EXISTS "stage" "stage";
ALTER TABLE "conversation" ADD COLUMN IF NOT EXISTS "persona" "persona_name";
ALTER TABLE "conversation" ADD COLUMN IF NOT EXISTS "messages" jsonb NOT NULL DEFAULT '[]';

-- Step 2: Backfill project_id from agent_task before dropping the FK column
UPDATE "conversation" SET "project_id" = (
  SELECT "project_id" FROM "agent_task" WHERE "agent_task"."id" = "conversation"."agent_task_id"
) WHERE "project_id" IS NULL AND "agent_task_id" IS NOT NULL;

-- Step 3: Set defaults for any remaining NULLs
UPDATE "conversation" SET "stage" = 'requirements' WHERE "stage" IS NULL;
UPDATE "conversation" SET "persona" = 'pablo' WHERE "persona" IS NULL;

-- Step 4: Now drop old columns
ALTER TABLE "conversation" DROP COLUMN IF EXISTS "agent_task_id";
ALTER TABLE "conversation" DROP COLUMN IF EXISTS "role";
ALTER TABLE "conversation" DROP COLUMN IF EXISTS "content";

-- Step 5: Apply NOT NULL constraints after backfill
ALTER TABLE "conversation" ALTER COLUMN "project_id" SET NOT NULL;
ALTER TABLE "conversation" ALTER COLUMN "stage" SET NOT NULL;
ALTER TABLE "conversation" ALTER COLUMN "persona" SET NOT NULL;

-- Add FK constraints
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_project_id_project_id_fk"
  FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_sprint_id_sprint_id_fk"
  FOREIGN KEY ("sprint_id") REFERENCES "sprint"("id") ON DELETE CASCADE;
