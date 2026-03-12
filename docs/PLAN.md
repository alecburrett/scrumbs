# Scrumbs — Implementation Plan

**Based on:** `docs/PRD.md` v1.0

---

## Guiding Principles

1. **Railway first.** Get the three services (web, agent, postgres) running on Railway before writing any feature code. Real infra flushes out env var and service communication issues early.
2. **Agent loop before personas.** Build the abstract streaming/tool execution infrastructure with a dummy echo persona before wiring in real Claude calls. Keeps Phase 2 testable without burning API credits.
3. **State machine as a single module.** Every `Sprint.status` transition goes through one function in `apps/web/lib/sprint-state-machine.ts`. No route touches status directly.
4. **Viktor last among personas.** Viktor is the most complex persona by far. All supporting infrastructure (SSE, approval gates, workspace cloning, context window management) must be solid before Viktor is wired up.
5. **Use `execFile` not `exec` for all subprocess calls.** Shell string interpolation is a command injection vector. All subprocess calls use `execFile` or `spawn` with argument arrays.

---

## Critical Path

```
Monorepo scaffold
  → packages/db schema + Railway postgres
    → Auth.js v5 + GitHub OAuth
      → Project dashboard + create project
        → Agent service base (Fastify + SSE + approval gates)
          → packages/personas (skill injection + persona modules)
            → Pablo (Requirements + PRD)
              → Sprint Planning (Stella + branch creation)
                → Viktor (Development — the core loop)
                  → Rex → Quinn → Dex → Stella retro
                    → Returning user flow + cross-cutting polish
```

Nothing in Phase 4+ can be built without a working agent loop. Nothing in Phase 3+ can be built without auth and the project shell.

---

## Phase 1 — Foundation

**Goal:** Deployable monorepo on Railway with auth, project creation, and database migrations running. No AI yet.

### Files to create

```
package.json                          # root workspace (npm workspaces)
tsconfig.base.json                    # shared TS config
.env.example                          # all required env vars documented

packages/db/
  package.json
  drizzle.config.ts
  src/
    schema/
      auth.ts                         # Auth.js managed tables (from @auth/drizzle-adapter)
      projects.ts                     # Project, Sprint, Story
      agent-tasks.ts                  # AgentTask, Artifact, Conversation
    index.ts                          # db client (Drizzle + postgres)
    migrate.ts                        # migration runner

packages/types/
  package.json
  src/
    index.ts                          # re-exports all types
    sprint.ts                         # SprintStatus enum, StoryStatus enum
    agent-task.ts                     # all AgentTask input/output shapes (from PRD §8)
    persona.ts                        # Persona interface
    artifact.ts                       # ArtifactType, Artifact

apps/web/
  package.json
  next.config.ts
  tailwind.config.ts                  # Tailwind v3
  components.json                     # shadcn/ui config
  auth.ts                             # Auth.js v5 config (GitHub provider + Drizzle adapter)
  middleware.ts                       # export { auth as middleware } from '@/auth'
  app/
    layout.tsx
    page.tsx                          # landing/login — "Continue with GitHub" CTA
    dashboard/
      layout.tsx                      # sidebar + main area shell
      page.tsx                        # project list (empty state)
    projects/
      new/page.tsx                    # create project form
  components/
    sidebar/
      project-list.tsx
      new-project-cta.tsx
    ui/                               # shadcn components (button, card, input, etc.)
  lib/
    db.ts                             # db import re-export for web
    github.ts                         # Octokit factory (token → RestOctokit instance)
    sprint-state-machine.ts           # ALL Sprint.status transition validation
```

### Key implementation notes

**`packages/db/src/schema/`** — write all tables from PRD §8 before running the first migration. All tables up front avoids cascading migration issues. Auth.js adapter tables must match the `@auth/drizzle-adapter` schema exactly — use the adapter's exported schema as the source of truth; do not rewrite it.

**`sprint-state-machine.ts`** — the single source of truth for all valid transitions. Every API route that changes `Sprint.status` calls `assertValidTransition()` before writing to DB.

```ts
const VALID_TRANSITIONS: Record<SprintStatus, SprintStatus[]> = {
  planning:    ['development'],
  development: ['review'],
  review:      ['development', 'qa'],
  qa:          ['development', 'deploying'],
  deploying:   ['complete', 'qa'],
  complete:    [],
}

export function assertValidTransition(
  from: SprintStatus,
  to: SprintStatus,
  trigger: string
): void {
  if (!VALID_TRANSITIONS[from]?.includes(to)) {
    throw new TransitionError(from, to, trigger)
  }
}
```

**Railway setup:** Deploy to Railway immediately after Phase 1 is functionally complete. Create the three services (web, agent, postgres). Set all env vars from `.env.example`. Verify Auth.js tables are migrated and the full GitHub OAuth flow completes before moving to Phase 2.

### Stories covered
US-01 (GitHub OAuth), US-02 (Create Project), US-03 (Dashboard + Sidebar)

---

## Phase 2 — Agent Service Core

**Goal:** A working Fastify streaming service with SSE, approval gates, token budgets, and reconnection — wired to a dummy echo persona. No real Claude calls yet.

### Files to create

```
apps/agent/
  package.json
  src/
    index.ts                          # Fastify server, auth hook, route registration
    routes/
      tasks.ts                        # POST /tasks, GET /tasks/:id/stream,
                                      # POST /tasks/:id/approve, POST /tasks/:id/cancel
    lib/
      agent-loop.ts                   # runAgentTask() — the core loop
      sse.ts                          # SSEEmitter class + per-session event buffer
      approval.ts                     # approval gate (Promise map pattern — see below)
      context-window.ts               # maybeSummariseHistory() + token estimate
      cost-guard.ts                   # token budget check + concurrency limit per userId
      retry.ts                        # Anthropic API retry (3x, exponential backoff)
      workspace.ts                    # clone repo, npm install, GIT_ASKPASS, cleanup
      tools/
        index.ts                      # tool registry + requiresApproval flag
        read-file.ts
        write-file.ts
        run-tests.ts
        bash.ts
        git-commit.ts
        git-push.ts
```

### Key implementation patterns

**Approval gate** — the agent loop pauses on any `requiresApproval` tool and waits for the user to respond via `POST /tasks/:id/approve`:

```ts
// lib/approval.ts
const gates = new Map<string, (approved: boolean) => void>()

export function waitForApproval(taskId: string): Promise<boolean> {
  return new Promise((resolve) => gates.set(taskId, resolve))
}

export function resolveApproval(taskId: string, approved: boolean): void {
  gates.get(taskId)?.(approved)
  gates.delete(taskId)
}
```

**SSE event buffer** — all events are buffered in memory by `sessionId` so that a reconnecting browser can replay missed events:

```ts
// lib/sse.ts
const buffers = new Map<string, SSEEvent[]>()

export class SSEEmitter {
  constructor(private sessionId: string, private res: ServerResponse) {
    if (!buffers.has(sessionId)) buffers.set(sessionId, [])
  }
  emit(event: SSEEvent): void {
    buffers.get(this.sessionId)!.push(event)
    this.res.write(`data: ${JSON.stringify(event)}\n\n`)
  }
  static replay(sessionId: string, res: ServerResponse): void {
    for (const event of buffers.get(sessionId) ?? []) {
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    }
  }
}
```

**Workspace setup with GIT_ASKPASS** — token is passed via environment variable, never embedded in the remote URL (avoids `ps aux` exposure). `execFile` is used instead of `exec` to prevent shell injection:

```ts
// lib/workspace.ts
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const execFileAsync = promisify(execFile)

export async function createWorkspace(taskId: string, repo: string, token: string) {
  const dir = `/tmp/scrumbs/${taskId}`
  const askpassPath = `/tmp/scrumbs/${taskId}-askpass.sh`

  await fs.writeFile(askpassPath, '#!/bin/sh\necho "$GIT_TOKEN"\n', { mode: 0o700 })

  const gitEnv = {
    ...process.env,
    GIT_ASKPASS: askpassPath,
    GIT_TOKEN: token,
    GIT_TERMINAL_PROMPT: '0',
  }

  await execFileAsync('git', ['clone', `https://github.com/${repo}.git`, dir], { env: gitEnv })
  await execFileAsync('npm', ['install'], { cwd: dir })

  return {
    dir,
    gitEnv,
    cleanup: () => Promise.all([
      fs.rm(dir, { recursive: true, force: true }),
      fs.unlink(askpassPath).catch(() => {}),
    ]),
  }
}
```

**Token counting** — use a character heuristic, no external package:

```ts
function estimateTokens(messages: MessageParam[]): number {
  return Math.ceil(JSON.stringify(messages).length / 4)
}
```

**Dummy persona for isolated testing:** Before wiring up real Claude API calls, implement `runAgentTask` to emit fake SSE events on a timer. This verifies the full SSE → buffer → reconnect → approval gate → cancellation path without API costs.

### Stories covered
US-08 (Task Reconnection), US-09 (Task Cancellation), US-17 (Cost Guard)

---

## Phase 3 — Personas + Pre-Sprint Flow

**Goal:** `packages/personas` with all 7 persona modules. Pablo live — users can complete Requirements and PRD stages end-to-end.

### Files to create

```
packages/personas/
  package.json
  src/
    skills/                           # skill markdown files copied from superpowers
      test-driven-development.md
      systematic-debugging.md
      subagent-driven-development.md
      using-superpowers.md
      writing-plans.md
      requesting-code-review.md
      receiving-code-review.md
      verification-before-completion.md
      finishing-a-development-branch.md
      using-git-worktrees.md
      executing-plans.md
    skill-loader.ts                   # reads skills at startup → frozen SKILL_CONTENT map
    types.ts                          # Persona interface + PERSONA_COLOURS constant
    pablo.ts
    stella.ts
    viktor.ts
    rex.ts
    quinn.ts
    dex.ts
    max.ts
    index.ts

apps/web/app/projects/[projectId]/
  layout.tsx                          # project shell: sidebar highlight, sprint progress bar
  requirements/page.tsx
  prd/page.tsx
  components/
    conversation-panel.tsx            # SSE-driven streamed persona messages
    artifact-panel.tsx                # markdown render of current artifact
    persona-message.tsx               # message bubble with persona colour + name
    handoff-card.tsx                  # animated transition card (≤1.5s, click-to-skip)
    approve-button.tsx                # stage approval CTA
    stage-progress-bar.tsx            # 6-stage indicator + pre-sprint indicator for new projects
```

### Key implementation notes

**Skill injection:** `skill-loader.ts` reads all `.md` files from `skills/` using `fs.readFileSync` at module load time. Exports a frozen `SKILL_CONTENT: Record<string, string>` map. Persona modules import this and inject skill content into system prompt strings at construction. No file I/O occurs during agent tasks.

**Persona colours** in `packages/personas/src/types.ts`:

```ts
export const PERSONA_COLOURS: Record<PersonaName, string> = {
  pablo:  '#F59E0B',
  stella: '#6B9E6B',
  viktor: '#3B82F6',
  rex:    '#7C3AED',
  quinn:  '#F97316',
  dex:    '#06B6D4',
  max:    '#64748B',
}
```

**SSE in the browser:** The conversation panel opens a native `EventSource` to the agent service's `GET /tasks/:id/stream`. On page load, check Postgres for any `running` tasks on the current sprint and auto-reconnect using the stored `sessionId`.

**Handoff animation:** The incoming persona's Claude API call is initiated *before* the animation starts. Animation runs ≤1.5s; incoming messages begin streaming when it settles or the user clicks.

### Stories covered
US-04 (Requirements), US-05 (PRD), US-15 (Progress Bar + Step-Back), US-16 (Handoff Animation)

---

## Phase 4 — Sprint Planning + Viktor

**Goal:** Full sprint planning ceremony with automatic branch creation, and Viktor's TDD implementation loop. Terminal panel, kanban strip, and approval gates all live.

### Files to create

```
apps/web/app/projects/[projectId]/sprints/[sprintId]/
  layout.tsx                          # sprint shell: kanban strip + terminal panel slot
  planning/page.tsx
  development/page.tsx
  components/
    terminal-panel.tsx                # dark panel, monospace font, SSE event rendering
    terminal-event.tsx                # per-event-type styled output (table below)
    approval-gate-banner.tsx          # amber banner with Approve / Reject buttons
    kanban-strip.tsx                  # To Do → In Progress → Done, real-time story cards
    step-back-modal.tsx               # confirms what gets superseded on step-back

apps/web/lib/
  agent-client.ts                     # typed wrapper for web → agent service HTTP calls
```

### Terminal panel event types

| `type` | Rendering |
|---|---|
| `tool_call` | Accent colour prefix + tool name, params streaming (dim) |
| `tool_output` | White monospace |
| `file_write` | Green + filename |
| `test_pass` | Green ✓ + test name |
| `test_fail` | Red ✗ + test name |
| `git_op` | Blue accent |
| `error` | Red with context |
| `approval_required` | Amber banner — blocks output until resolved |
| `context_summary` | Dim — "Context summarised at ~Xk tokens" |
| `retry` | Dim — "Retrying API call (attempt N/3)…" |
| `story_status` | Not shown in terminal — consumed by kanban strip |
| `done` | Signals agent loop complete |

### Key implementation notes

**Branch creation on sprint plan approval** happens in the Next.js API route, not in the agent service:
1. `assertValidTransition('planning', 'development', 'sprint-plan-approved')`
2. `octokit.rest.git.createRef()` creates the feature branch from `defaultBranch`
3. Updates `Sprint.featureBranch` + `Sprint.status = 'development'` in DB
4. Creates the Viktor `AgentTask` record (including `githubToken` from session), returns `taskId`

**Viktor's workspace:** All file path arguments in Viktor's tool calls are validated against the task's working directory. The tool implementations reject any path that resolves outside `/tmp/scrumbs/{taskId}/`.

**Real-time story status:** Viktor emits `story_status` SSE events (`{ storyId, status }`). The browser consumes these directly to update the kanban strip and fires a `PATCH /api/sprints/:sprintId/stories/:storyId` to persist to DB. DB writes stay in the web service.

**Context window summarisation** — after each tool loop iteration:
1. `estimateTokens(messages)` — if above ~120k (60% of Sonnet's ~200k context):
2. Call Haiku: "Summarise this conversation, preserving: files created/modified, test results, story progress, pending decisions"
3. Replace older messages with a single `user` summary message; keep last 3 turns verbatim
4. Emit `context_summary` SSE event

### Stories covered
US-06 (Sprint Planning + auto branch creation), US-07 (Viktor TDD Implementation)

---

## Phase 5 — Sprint Completion

**Goal:** Rex, Quinn, Dex, and Stella retro fully wired. A sprint can run end-to-end.

### Files to create

```
apps/web/app/projects/[projectId]/sprints/[sprintId]/
  review/page.tsx
  qa/page.tsx
  deploy/page.tsx
  retro/page.tsx
```

### Key implementation notes

**Rex (Code Review):** Fetch PR diff via `octokit.rest.pulls.get()` with `mediaType: { format: 'diff' }`, inject into `RexInput`. The "Proceed to QA" API route rejects if any unresolved 🔴 findings exist in DB — UI enforcement alone is insufficient.

**Quinn (QA):** Runs tests via the `bash` tool in the task workspace. Test output is parsed for pass/fail lines. The `qa → deploying` transition is rejected at the API route level if any test failure is recorded.

**Dex (Deploy):** Checks for a GitHub Actions workflow file; generates and commits one if absent via `octokit.rest.repos.createOrUpdateFileContents()`. Polls `octokit.rest.actions.listWorkflowRuns()` for run status. Production deploy requires the same `waitForApproval()` mechanism as Viktor.

**Retro → "Start Sprint N+1"** — API route:
1. Guard: `currentSprint.status === 'complete'`
2. Create new `Sprint` with `number: current + 1`, `status: 'planning'`
3. Query `Story` records with `status: 'todo'` from completed sprint; associate as carry-forwards
4. Redirect to `/projects/:id/sprints/:newSprintId/planning`

### Stories covered
US-10 (Rex Code Review), US-11 (Quinn QA), US-12 (Dex Deploy), US-13 (Retro)

---

## Phase 6 — Cross-Cutting + Polish

**Goal:** Returning user flow, error handling hardening, step-back, and remaining gaps.

### Files to create / modify

```
apps/web/
  lib/
    error-handling.ts                 # Anthropic retry wrapper, GitHub 401 re-auth trigger
  components/
    connection-indicator.tsx          # amber/green dot, auto-reconnect on disconnect
```

### Key implementation notes

**Returning user flow (US-14):** Dashboard loads each project's latest sprint. If a sprint is in `planning` through `deploying`, that project links to the sprint's current stage. "New Sprint" is disabled if a sprint is already in progress.

**Step-back:** Modelled as a reverse transition in the state machine. The API route:
1. Determines `prior = PRIOR_STAGE[current]`
2. Calls `assertValidTransition(current, prior, 'step-back')`
3. Marks all `Artifact` records for the current stage as `status: 'superseded'`
4. Sets `Sprint.status = prior`
5. Does NOT roll back git commits — partial work stays on the feature branch

**Anthropic retry** (`retry.ts`):
- Retryable codes: 429, 500, 502, 503, 529
- 3 attempts, backoff: 1s → 2s → 4s (cap 30s)
- Each retry emits a `retry` SSE event
- After 3 failures: emit `error` event, set `AgentTask.status = 'failed'`

**GitHub token expiry:** When the agent service records `AgentTask.error = 'github_auth_expired'`, the browser triggers sign-out + redirect to GitHub OAuth to re-acquire a fresh token.

### Stories covered
US-14 (Returning User Flow), US-18 (Error Handling + Recovery)

---

## Environment Variables

```bash
# apps/web
DATABASE_URL=                    # Railway provides automatically
AUTH_SECRET=                     # openssl rand -hex 32
AUTH_URL=                        # https://{web-service}.up.railway.app
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AGENT_SERVICE_URL=               # https://{agent-service}.up.railway.app
AGENT_SERVICE_SECRET=            # openssl rand -hex 32

# apps/agent
DATABASE_URL=                    # same as above
ANTHROPIC_API_KEY=
AGENT_SERVICE_SECRET=            # same shared secret
```

---

## Package Versions

Verify exact latest patch on npm before starting. Pin to minor (`~`).

| Package | Target |
|---|---|
| next | ~15.2.x |
| @auth/core | ~0.37.x |
| @auth/drizzle-adapter | ~1.x |
| drizzle-orm | ~0.36.x |
| drizzle-kit | ~0.28.x |
| fastify | ~5.x |
| @anthropic-ai/sdk | ~0.39.x |
| @octokit/rest | ~21.x |
| zod | ~3.x |
| vitest | ~3.x |
| tailwindcss | ~3.x |

> Versions correct as of PRD date (2026-03-12). Do not assume — verify against npm.
