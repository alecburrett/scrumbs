# PRD Gap Closure — Design Spec

**Date:** 2026-03-13
**Status:** Approved

---

## Context

A comprehensive gap analysis identified 44 differences between the PRD (docs/PRD.md) and the current implementation. These span schema, types, agent behavior, UI, and workflow. This spec defines the phased approach to close all gaps.

**Prerequisite:** PR #78 merged to main first. Each phase is a separate PR from a dedicated branch.

---

## Phase 1: Schema Alignment

**Branch:** `fix/schema-alignment`
**Depends on:** Nothing (foundation)

### Project table — add missing columns
- `description` text nullable
- `defaultBranch` text default "main"
- `status` enum: active | archived (new enum)

### Sprint table — add missing columns
- `goal` text nullable
- `prUrl` text nullable
- `deployUrl` text nullable

### Story table — add missing columns + rename
- `points` integer nullable
- `acceptanceCriteria` text nullable
- Rename `order` → `sortOrder`

### AgentTask table — add missing columns
- `projectId` uuid FK → projects.id
- `stage` text not null
- `startedAt` timestamp nullable
- `completedAt` timestamp nullable

### Artifact table — fixes
- `sprintId` change from NOT NULL to nullable (project-level artifacts)
- `status` enum: rename 'active' → 'current' (keep 'superseded')
- Add `projectId` uuid FK → projects.id
- Add `commitSha` text nullable

### Conversation table — restructure
- Add `projectId` uuid FK → projects.id
- Add `stage` enum matching sprint stages
- Add `persona` enum matching persona names
- Change from single role+content per row to `messages` jsonb array

### AgentTask defaults
- Token budget default: 150,000 → 100,000

### Type definitions (packages/types)
- Align all 7 persona input shapes to match PRD section 8
- Add AgentTaskOutput type (summary, artifactsCreated, storiesUpdated, errors)
- Add MessageRecord type

### Drizzle migration
- Single migration covering all schema changes
- Verify with `drizzle-kit push` against test DB
- All packages build clean after changes

---

## Phase 2: Agent Correctness

**Branch:** `fix/agent-correctness`
**Depends on:** Phase 1

### Skill injection fixes
| Persona | Add Skills |
|---------|-----------|
| Viktor | systematic-debugging, subagent-driven-development |
| Dex | finishing-a-development-branch |
| Max | using-git-worktrees, executing-plans |
| Stella | writing-plans |
| Quinn | (systematic-debugging already present; test-execution/QA-reporting skill files don't exist — skip, not blocking) |
| Pablo | (requirements-ingestion/PRD-authoring skill files don't exist — skip, not blocking) |

### Approval gate fixes
- `write-file.ts`: set `requiresApproval: true`
- `git-commit.ts`: set `requiresApproval: true`

### Context window threshold
- `context-window.ts`: change CONTEXT_THRESHOLD from 120,000 → 72,000

### Stage input wiring
- Each stage client.tsx passes correct fields per PRD input shapes
- Include projectId, sprintId, githubToken where required
- Wire githubToken retrieval in task creation API route

### Rate limiting
- Return HTTP 429 with Retry-After header when concurrent limit hit (instead of just failing)

---

## Phase 3: UI Wiring

**Branch:** `fix/ui-wiring`
**Depends on:** Phase 1 (story points column), Phase 2 (correct agent behavior)

### StageProgressBar
- Expand to show all stages correctly: Requirements, PRD, Planning, Development, Review, QA, Deploy, Retro
- Separate Review and QA (currently combined as "review-qa")
- Map sprint status to correct stage highlight

### HandoffCard integration
- Import and render HandoffCard in StageWorkspace during stage transitions
- Show outgoing persona message + incoming persona intro
- API call initiated before animation completes (non-blocking)

### StepBackModal integration
- Add "Step Back" button to all sprint stage pages
- Import and wire StepBackModal with confirmation flow
- On confirm: call step-back API, redirect to prior stage

### Stage navigation
- Completed stages: clickable, route to read-only review of that stage's artifacts
- Future stages: show descriptive tooltip on hover explaining lock reason

### Kanban strip
- Show in QA stage (not just Development)
- Display story point totals per column
- Fix artifact panel width: 50% → 40% (conversation 60%)

### Velocity display
- Show velocity metric on sprint pages where applicable

---

## Phase 4: Workflow Completeness

**Branch:** `fix/workflow-completeness`
**Depends on:** Phase 1 (prUrl/deployUrl columns), Phase 2 (correct inputs)

### Artifact commits to GitHub
- On planning approval: commit `sprints/sprint-N.md` to feature branch
- On retro completion: commit `sprints/sprint-N-retro.md` to feature branch

### Transition side effects
- development→review: store PR URL in `Sprint.prUrl`
- deploying→complete: create deploy-record artifact, store URL in `Sprint.deployUrl`
- review→qa: validate PR has no unresolved critical findings before allowing transition

### Max intro
- At development stage start, emit Max persona message: "Branch ready. Viktor, you're up."

### Sprint N+1 context
- When creating next sprint from retro, feed Stella: prior retro content + carry-forward stories as input context

---

## Phase 5: Polish

**Branch:** `fix/prd-polish`
**Depends on:** All prior phases

### Enum alignment
- Artifact types: qa-report→test-report, code-review→review, deploy-log→deploy-record
- Story status: pick one convention (snake_case per PRD: in_progress)

### Column name alignment (where practical without breaking too much)
- Evaluate inputJson→input, outputJson→output, errorMessage→error, contentMd→content
- Only rename if migration cost is low

### UI polish
- Done animation on Kanban strip
- Terminal event prefix: `[tool]` → `▶ tool_call` format
