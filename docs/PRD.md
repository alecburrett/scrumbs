# Scrumbs — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-12
**Status:** Approved for implementation

---

## 1. Vision

Scrumbs is a web-based development lifecycle orchestrator that wraps the Claude AI engine in an agile scrum persona team, guiding developers from raw requirements to shipped features through a structured, methodology-enforced workflow.

The methodology beneath Scrumbs is obra/superpowers — a battle-tested agentic skills framework. The superpowers skills are not exposed as commands. They are embodied by characters. Each scrum team member is a persona, and that persona secretly runs their assigned skill(s) from the superpowers framework.

**The user experience:** You're working with a great team. The team just happens to be very fast, never sleeps, and always follows the process.

---

## 2. The Scrum Team

**Team ethos:** Positive, collaborative, genuinely excited. No cynicism, no friction. High-performing and happy.

**Stella's cross-cutting role:** Stella owns using-superpowers — she is the orchestrator who knows which team member to call in any situation. She routes work, manages ceremonies, and is always on call between stages.

### Pablo — Product Owner

- **Personality:** Enthusiastic, user-obsessed, big-picture thinker. Speaks in user stories. Celebrates requirements like breakthroughs.
- **Affectations:** "The value here is…", "From the user's perspective…", "I'm adding this to the backlog!"
- **Underlying Skills:** brainstorming, requirements ingestion, PRD authoring
- **Scope:** Project-level — Requirements & PRD (once per project, updated on request)

### Stella — Scrum Master & Orchestrator

- **Personality:** Warm, process-loving, ceremony-enthusiastic. Makes the workflow feel like a gift. Excellent situational awareness — always knows who should be working on what.
- **Affectations:** Names ceremonies explicitly. "Let's get Pablo in here for this." Timeboxes cheerfully. Loves a well-run retrospective.
- **Underlying Skills:** using-superpowers (routing/orchestration), writing-plans, sprint structure
- **Scope:** Sprint-level ceremonies + cross-cutting routing throughout all stages

### Viktor — Senior Developer

- **Personality:** Focused, methodical, TDD true believer. Precise, calm, quietly proud of clean work. Dry humour.
- **Affectations:** "Red first, then green." "The test is the specification." Genuinely excited when a test catches a real bug.
- **Underlying Skills:** test-driven-development, systematic-debugging, subagent-driven-development
- **Scope:** Sprint-level — all code writing, debugging, implementation

### Rex — Tech Lead

- **Personality:** Enthusiastic architecture mentor. Loves elegant patterns. Reviews are one of his favourite things — a chance to teach and learn.
- **Affectations:** Gets excited about architectural decisions. Ends reviews with: LGTM / Let's Improve This / One More Pass.
- **Underlying Skills:** requesting-code-review, receiving-code-review, verification-before-completion
- **Scope:** Sprint-level — code review, PR approvals, architecture decisions

### Quinn — QA Engineer

- **Personality:** Gleeful edge-case hunter. Catching bugs before users do feels like a superpower. Optimistic, curious, thorough.
- **Affectations:** "What if the user does this?" (with delight). "I found three interesting edge cases!" is a good day.
- **Underlying Skills:** verification-before-completion, test execution, QA reporting
- **Scope:** Sprint-level — testing, test reports, pre-deploy verification

### Dex — DevOps Engineer

- **Personality:** Action-oriented, pipeline-obsessed, loves shipping. Gets satisfaction from green CI and clean deploys.
- **Affectations:** "We're green." "Staging looks good." Celebrates deploys like finishing a race.
- **Underlying Skills:** finishing-a-development-branch, GitHub Actions, deployment management
- **Scope:** Sprint-level — CI/CD, deployments, rollbacks

### Max — Tech Operations

- **Personality:** Sees the whole board. Thinks in systems, calm and strategic. Loves a clean git graph.
- **Affectations:** "Branch is ready." "We're set up." "Viktor, you're up." Calm handoff energy.
- **Underlying Skills:** using-git-worktrees, executing-plans
- **Scope:** Sprint-level — feature branch creation, dev environment handoff to Viktor. *(Parallel lane orchestration is a Phase 2 capability.)*

### Coach — *(SaaS Pro tier — post-MVP)*

- **Personality:** Meta-level team builder. Helps users customise personas, create new skills, adapt the methodology to their workflow. Wise, process-curious, loves the meta-game.
- **Affectations:** "What's not working?", reflects patterns back, "the craft of the workflow". Gets excited about new skills like a coach excited about a new drill.
- **Underlying Skills:** writing-skills
- **Scope:** Platform-level — persona customisation, custom skill creation (unlocked on Pro tier)

---

## 3. Project & Sprint Model

### Core Principle: 1 Project = 1 GitHub Repo

A project in Scrumbs maps directly to a single GitHub repository. One-to-one. Always.

```
Project (= GitHub Repo)
  ├── Requirements doc       (project-level, lives in repo)
  ├── PRD.md                 (project-level, lives in repo)
  └── Sprints
        ├── Sprint 1         (feature branch, merged)
        ├── Sprint 2         (feature branch, merged)
        └── Sprint 3         (current, in progress)
```

### Project-Level vs. Sprint-Level

| What                   | Owner  | Level   | Frequency                |
| ---------------------- | ------ | ------- | ------------------------ |
| Requirements           | Pablo  | Project | Once, updated on request |
| PRD                    | Pablo  | Project | Once, updated on request |
| Sprint plan            | Stella | Sprint  | Each sprint              |
| Implementation + tests | Viktor | Sprint  | Each sprint              |
| Code review            | Rex    | Sprint  | Each sprint              |
| QA sign-off            | Quinn  | Sprint  | Each sprint              |
| Deployment             | Dex    | Sprint  | Each sprint              |
| Retrospective          | Stella | Sprint  | Each sprint              |

### New Project Flow (first time)

The Requirements and PRD stages are a **pre-sprint flow** — they appear before the 6-stage sprint progress bar. Once the PRD is approved, the user enters the sprint cycle.

```
[Pre-Sprint]                      [Sprint Cycle — 6 stages]
Requirements → PRD → Sprint Planning → Development → Review → QA → Deploy → Retro
    Pablo      Pablo      Stella          Viktor       Rex    Quinn   Dex    Stella
```

On sprint plan approval, Stella automatically creates the feature branch (via Max in the background). Max introduces himself briefly at the top of the Development stage before handing to Viktor.

### Returning User Flow (new feature on existing project)

```
Sprint N Planning → Development → Review → QA → Deploy → Retro
      Stella          Viktor       Rex    Quinn   Dex    Stella
```

The user triggers a new sprint via the "Start Sprint N+1" CTA on the previous sprint's retrospective, or via a "New Sprint" action on the project dashboard. Stella reads the previous retro and any backlog carry-forwards before proposing the new sprint plan.

Pablo is called back in only when the PRD needs updating (e.g. major pivot, new module). Stella handles the routing.

---

## 4. Core Workflow — Sprint Stages in Detail

### Stage 1 — Sprint Planning (Stella)

- Stella reads the current PRD + backlog from the repo
- For Sprint N+1: Stella also reads `sprints/sprint-(N)-retro.md` and any carry-forward stories
- Decomposes into sprint: goal, user stories, story points, acceptance criteria
- User approves or requests changes
- On approval: feature branch automatically created in GitHub (e.g. `sprint-3-user-auth`), `Sprint.featureBranch` set
- **Output:** `sprints/sprint-N.md` committed to repo + feature branch created

### Stage 2 — Development (Viktor)

- Max introduces himself briefly ("Branch ready. Viktor, you're up.") then hands off
- Viktor runs subagent-driven-development
- Agent service clones the user's GitHub repo fresh per task into a temporary working directory, installs dependencies, then proceeds
- Terminal panel streams all tool use in real-time (file reads/writes, tests, git, bash)
- Strictly enforces TDD: tests written before implementation, always
- **Output:** committed code on feature branch + test results

### Stage 3 — Code Review (Rex)

- Rex reviews the PR diff against PRD, sprint plan, code quality, test coverage
- Issues: 🔴 Critical / 🟡 Let's Improve This / 🟢 Minor Suggestion
- Viktor looped in for Critical fixes
- **Output:** approved PR

### Stage 4 — QA (Quinn)

- Quinn runs full test suite, flags failures, coverage gaps, edge cases
- Coordinates with Viktor for fixes
- **Output:** QA sign-off report

### Stage 5 — Deploy (Dex)

- Dex triggers GitHub Actions pipeline
- Preview deploy → user approval → production
- **Output:** live production URL + deploy record

### Stage 6 — Retrospective (Stella)

- What shipped, what took longer, carry-forwards
- Backlog updated in repo
- **Output:** `sprints/sprint-N-retro.md` committed

---

## 5. Sprint Status State Machine

Sprint status drives the entire workflow. Only the transitions below are valid. Any attempt to transition outside this graph is rejected at the service layer.

```
                    ┌──────────────────────────────────┐
                    │         Step-Back Rules           │
                    │  Any stage can step back to the   │
                    │  immediately prior stage only.    │
                    │  Step-back resets the current      │
                    │  stage's artifacts to superseded.  │
                    └──────────────────────────────────┘

planning ──► development ──► review ──► qa ──► deploying ──► complete
                  ▲              │       ▲        │
                  │              │       │        │
                  └──────────────┘       └────────┘
                 (critical fixes)      (test failures)
```

**Valid transitions:**

| From          | To            | Trigger                                       |
| ------------- | ------------- | --------------------------------------------- |
| `planning`    | `development` | User approves sprint plan (branch auto-created) |
| `development` | `review`      | Viktor completes all stories                  |
| `review`      | `development` | Rex issues 🔴 Critical finding → Viktor fixes  |
| `review`      | `qa`          | User approves PR (no unresolved 🔴 findings)   |
| `qa`          | `deploying`   | Quinn signs off (all tests pass)               |
| `qa`          | `development` | Test failures → Viktor fixes                  |
| `deploying`   | `complete`    | Production deploy succeeds                    |
| `deploying`   | `qa`          | Deploy failure → back to QA for diagnosis      |

**Step-back rules:** User can step back from any stage to its immediately prior stage only. Step-back requires confirmation. Stepping back marks the current stage's artifacts as `superseded` and resets `Sprint.status` to the prior stage. Stepping back from `development` does not roll back git commits — partial work remains on the feature branch.

---

## 6. Technical Architecture

### Platform: Railway-Only

One platform. No Vercel. Railway handles everything.

```
Railway Project: Scrumbs
  ├── Service: web            (Next.js app — npm run start)
  ├── Service: agent          (persistent Fastify streaming service)
  └── Service: postgres       (Postgres database — Railway managed)
```

No external services. Everything in one Railway project.

**Why Railway over Vercel:**

- Persistent Node.js servers — no serverless timeout for long AI agent runs
- One platform for web + agent service + database
- Simplest self-hosting: `railway up` from a clone
- No external auth service, no second billing account

### Monorepo Structure (npm workspaces)

The web and agent services share database schema, TypeScript types, and persona definitions. The repo uses native npm workspaces — no additional build tooling at MVP scale.

```
scrumbs/
├── apps/
│   ├── web/           # Next.js 15 app (Railway service: web)
│   └── agent/         # Fastify persistent server (Railway service: agent)
├── packages/
│   ├── db/            # Drizzle schema, migrations, db client (shared)
│   ├── types/         # Shared TypeScript types (Persona, Artifact, AgentTask, etc.)
│   └── personas/      # Persona modules + superpowers skill injection (shared)
└── package.json       # Root workspace (npm workspaces)
```

This means `apps/agent` can import `{ db } from '@scrumbs/db'` and `{ viktor } from '@scrumbs/personas'` and avoid code duplication.

> **Note on Turborepo:** Turborepo's build caching and task pipeline orchestration add real value across many packages. At MVP with two services, npm workspaces alone is sufficient. Turborepo can be layered in when Phase 2 introduces additional packages and build complexity.

### Framework: Next.js 15 on Railway

**Decision rationale:**

- shadcn/ui: production-quality component library, fastest path to polished UI
- Deep ecosystem for streaming and Claude API examples
- `railway up` runs `next start` — trivially deployable

**Tailwind & shadcn/ui version note:** Use **Tailwind CSS v3** with shadcn/ui for MVP. shadcn/ui's stable release targets Tailwind v3. Do not use Tailwind v4 — its `@theme` API is not yet fully compatible with shadcn/ui's component library. Verify shadcn/ui compatibility before any future migration to Tailwind v4.

### Agent Service: Fastify

The agent service uses Fastify over Express for:

- Superior async handler support — important for concurrent SSE streams
- Better TypeScript ergonomics out of the box
- Higher throughput under concurrent streaming workloads
- Native JSON schema validation

**SSE implementation:** Fastify does not have built-in SSE support. Use `reply.raw` (the underlying Node.js `ServerResponse`) to write SSE frames directly. Do not use `@fastify/sse` — it is unmaintained. Pattern:

```ts
fastify.get('/tasks/:id/stream', async (request, reply) => {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  // Write events via reply.raw.write(`data: ${JSON.stringify(event)}\n\n`)
  // Clean up on reply.raw.on('close', ...)
})
```

### Auth: Auth.js v5 (NextAuth) + GitHub OAuth

Authentication is handled by Auth.js v5 with the Drizzle adapter, storing sessions in Railway Postgres. No external auth service.

**How it works:**

- User clicks "Continue with GitHub" → Auth.js handles the full OAuth flow
- GitHub access token stored **encrypted in Postgres** via the session record (not in the JWT payload)
- Token retrieved server-side per request via `auth()` — not exposed in cookies
- All DB access goes through Next.js API routes → Drizzle → Railway Postgres
- Data isolation enforced by service layer: every query filters by `userId`
- Row Level Security not used — service-layer checks are simpler and auditable

**Auth.js managed tables:** The Drizzle adapter requires specific table schemas. These tables live in `packages/db` and are owned by Auth.js — do not modify their column structure:

- `users` — user profile (id, name, email, image)
- `accounts` — OAuth provider accounts (provider, providerAccountId, access_token, refresh_token, etc.)
- `sessions` — active sessions (sessionToken, userId, expires)
- `verification_tokens` — email verification (not used at MVP, but required by the adapter schema)

Use the official `@auth/drizzle-adapter` schema definitions as the source of truth. Application-specific user data (e.g. settings, preferences) should be added to a separate `user_settings` table, not by modifying the Auth.js `users` table.

Middleware is one line:

```ts
export { auth as middleware } from '@/auth'
```

GitHub token scope: `read:user repo` — needed for branch/commit/PR operations.

**Why encrypted-in-Postgres over JWT for the GitHub token:**  
The GitHub token carries `repo` scope (full repository read/write). Storing it in a JWT that persists in a cookie creates an unnecessary attack surface — JWTs are not revocable without rotating the secret. The Drizzle adapter stores the token in the `accounts` table where it can be individually invalidated and is not transmitted to the client.

### Web → Agent Service Authentication

The web service authenticates to the agent service using a shared secret passed as a Bearer token in the `Authorization` header. The agent service validates this token on every request before processing.

```ts
// Web service (caller)
await fetch(`${AGENT_SERVICE_URL}/tasks`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${AGENT_SERVICE_SECRET}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ ... }),
})

// Agent service (receiver)
fastify.addHook('onRequest', async (request, reply) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  if (token !== process.env.AGENT_SERVICE_SECRET) {
    reply.code(401).send({ error: 'Unauthorized' })
  }
})
```

The `userId` is passed in the request body (trusted because the web service has already authenticated the user via Auth.js). The agent service does not perform its own user authentication — it trusts the web service as the sole caller.

### Agent Task Coordination

The web service tells the agent service to start a task via HTTP POST, then streams results back via SSE. An `agent_tasks` table tracks all task state, enabling reconnection if the browser disconnects mid-task.

```
web service                    agent service
    │                               │
    ├─ POST /tasks (create task) ──►│
    │◄─ { taskId } ─────────────────┤
    │                               │
    ├─ GET /tasks/:id/stream ───────►│ (SSE — reconnectable by taskId)
    │◄─ tool_call events ────────────┤
    │◄─ tool_output events ──────────┤
    │◄─ text events ─────────────────┤
    │◄─ done ────────────────────────┤
    │                               │
    └─ PATCH /api/sprints/:id ──────► (web updates sprint status in DB)
```

If the browser disconnects, reconnecting with the same `taskId` resumes the stream from the agent's current position. The agent service buffers all emitted events in memory indexed by `sessionId`.

**Event buffer durability (MVP):** The event buffer is in-memory only. If the agent service restarts (e.g. during a Railway deploy), all in-flight sessions lose their event buffer. The task will show `status: 'failed'` with `error: 'Agent service restarted — task interrupted'`. The user can restart the task; partial git commits already made remain on the feature branch. A durable event store (Redis or Postgres-backed) is a Phase 2 enhancement.

### The AI Streaming Architecture

```
Browser (Next.js 15)
  │
  ├── Short requests → apps/web API routes → packages/db → Postgres
  │
  └── Long AI tasks → apps/agent (Railway, no timeout)
                          │
                          ├── packages/db (shared schema)
                          ├── packages/personas (shared persona modules)
                          ├── @anthropic-ai/sdk — messages.stream()
                          │     ├── Custom tool execution loop (while tools remain)
                          │     ├── Approval gate middleware → SSE pause → user confirms
                          │     ├── tool_call events → SSE → terminal panel
                          │     ├── tool_output events → SSE → terminal panel
                          │     └── text events → SSE → message bubble
                          └── GitHub API via @octokit/rest (commits, PRs, branch ops)
```

**Why the Anthropic SDK directly, not the Vercel AI SDK:**  
Scrumbs is provider-locked to Claude. The Vercel AI SDK's multi-provider abstraction adds no value here and its agentic agent classes (`ToolLoopAgent`, `DurableAgent`) and tool-level approval mechanisms (`needsApproval`) do not exist in any released version. The Anthropic SDK's `messages.stream()` is stable, well-documented, and gives full control over the tool execution loop, context window management, and streaming.

**Tool execution loop pattern (agent service):**

```ts
// packages/personas/viktor.ts defines tools and system prompt
// apps/agent implements the loop:

async function runAgentTask(task: AgentTask, emit: SSEEmitter) {
  const messages: MessageParam[] = [{ role: 'user', content: task.input }]

  while (true) {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: viktor.systemPrompt,
      tools: viktor.tools,
      messages,
    })

    for await (const event of stream) {
      emit(event)  // → SSE → terminal panel
    }

    const response = await stream.finalMessage()

    if (response.stop_reason === 'end_turn') break

    // Process tool calls — pause for approval if required
    const toolResults = await executeToolsWithApproval(response.content, emit)
    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })

    // Context window management — summarise if approaching limit
    messages = await maybeSummariseHistory(messages, TOKEN_BUDGET_CONTEXT)
  }
}
```

### Context Window Management

Agent tasks for complex sprints can accumulate large conversation histories (tool calls, tool results, code output). Without management, this will exceed the context window.

**Strategy — rolling summarisation:**

- After each tool loop iteration, count approximate tokens in the `messages` array
- When total exceeds 60% of the model's context window (currently ~120k tokens for Sonnet, so threshold = ~72k tokens), trigger summarisation
- Summarisation: take all messages except the system prompt and the last 3 turns, and replace them with a single `user` message containing a summary generated by a lightweight Claude call (Haiku)
- The summary preserves: files created/modified, test results, current story progress, any pending decisions
- The last 3 turns are kept verbatim to maintain immediate working context
- Summarisation events are emitted to the SSE stream as `context_summary` events (visible in terminal panel as a dim "Context summarised" indicator)

**Token counting:** Use a simple character-count heuristic (`tokens ≈ chars / 4`) for the budget check. Exact counting is not required — the 60% threshold provides sufficient headroom. Do not add `@anthropic-ai/tokenizer` as a dependency.

**Human-in-the-loop approval pattern:**  
Tools flagged as requiring approval pause the agent loop and emit an `approval_required` SSE event to the terminal panel. The loop awaits a Promise that resolves only when the web service POSTs the user's approval or rejection to `POST /tasks/:id/approve`. Rejected operations are not executed; Viktor receives the rejection as a tool result and must revise.

### Agent Service Filesystem Model

Viktor's tools (`readFile`, `writeFile`, `runTests`, `bash`, `gitCommit`, `gitPush`) operate on an actual filesystem. The agent service must have a working copy of the user's GitHub repo with dependencies installed.

**Strategy — clone fresh per task:**

- On task start, clone the target GitHub repo into a temporary working directory: `/tmp/scrumbs/{taskId}/`
- Run `npm install` (or the project's relevant install command) in the cloned directory
- All Viktor tool calls operate within this directory
- On task completion or cancellation, the directory is cleaned up

**Rationale:** A fresh clone per task is simple, correct, and avoids stale state between tasks. The overhead (clone + install) is acceptable at MVP — it happens once per Viktor task. Caching `node_modules` across tasks is a Phase 2 optimisation.

**GitHub token for git push:** Git push uses the user's GitHub OAuth token for authentication. The token is passed via HTTPS remote URL: `https://{githubToken}@github.com/{owner}/{repo}.git`. The token is never written to disk — it is used only in the clone URL and not stored in the repo's `.git/config`.

**User isolation:** Each task uses a unique `taskId`-namespaced directory. Concurrent tasks for different users cannot access each other's working directories.

### Persona Architecture

```ts
// packages/personas/viktor.ts
export const viktor: Persona = {
  name: 'Viktor',
  role: 'Senior Developer',
  colour: 'blue',
  systemPrompt: `
    You are Viktor, a senior developer who believes deeply in test-driven development.
    ${SKILL_CONTENT['test-driven-development']}
    ${SKILL_CONTENT['systematic-debugging']}
    ${SKILL_CONTENT['subagent-driven-development']}
    Your voice: precise, methodical, dry humour. "Red first, then green."
  `,
  tools: [
    readFile,
    runTests,
    bash,
    { ...writeFile,   requiresApproval: true },
    { ...gitCommit,   requiresApproval: true },
    { ...gitPush,     requiresApproval: true },
  ],
}
```

Tools marked `requiresApproval: true` are handled by the agent loop's approval middleware — not by any SDK mechanism.

### Cost Guard & Rate Limiting

Required before any multi-user exposure:

- Each `AgentTask` has a configurable max token budget (default: 100k tokens input+output)
- Agent service enforces a max of 3 concurrent tasks per user
- Tasks exceeding their token budget are automatically cancelled with status `'cancelled'` and `error: 'Token budget exceeded'`
- `AgentTask.tokenUsage` (input + output tokens) logged after each loop iteration
- Rate limit exceeded returns HTTP 429 with `Retry-After` header; surfaces as user-facing message in UI

**Token budget exhaustion UX:** When a task reaches 80% of its token budget, the terminal panel displays an amber warning: "Token budget at 80% — task will auto-cancel at 100%." If the task is cancelled due to budget exhaustion, the user is presented with two options: (1) "Increase budget and resume" — doubles the budget and restarts the task with the most recent context summary as input, or (2) "Cancel" — leave the task as cancelled. Partial work (git commits) is preserved in both cases.

### Tech Stack

| Concern              | Choice                                  | Version         | Rationale                                                       |
| -------------------- | --------------------------------------- | --------------- | --------------------------------------------------------------- |
| Platform             | Railway                                 | —               | Persistent servers, one platform, self-host friendly            |
| Repo structure       | npm workspaces                          | —               | Shared db/types/personas; no build tooling overhead at MVP      |
| Framework            | Next.js (App Router)                    | 15.x            | shadcn/ui, streaming ecosystem, trivially deployable on Railway |
| Styling              | Tailwind CSS v3 + shadcn/ui             | 3.x             | shadcn/ui targets v3; v4 migration deferred                    |
| AI SDK               | @anthropic-ai/sdk                       | 0.39.x (latest) | Direct SDK, stable streaming API, provider-locked product       |
| AI model             | claude-sonnet-4-6                       | —               | Core engine, all personas                                       |
| Agent HTTP framework | Fastify                                 | 5.x             | Superior async/SSE handling, better TS support than Express     |
| Database             | Railway Postgres (via Drizzle)          | —               | Same ecosystem, no extra service                                |
| ORM                  | Drizzle ORM + drizzle-kit               | 0.36.x / 0.28.x | Lightweight, idiomatic TypeScript                               |
| Validation           | Zod                                     | 3.x             | Stable, battle-hardened; v4 deferred until stable release       |
| Auth                 | Auth.js v5 (NextAuth) + Drizzle adapter | 5.x             | GitHub OAuth, 1 npm package, token stored in Postgres           |
| GitHub client        | @octokit/rest                           | 21.x            | ESM — use `import`, not `require`                               |
| Transport            | SSE (agent service → browser)           | —               | No timeout, reconnectable by taskId                             |
| CI/CD                | GitHub Actions                          | —               | Standard, Dex manages it                                        |
| Runtime              | Node.js                                 | 20+ LTS         | Current LTS                                                     |
| TypeScript           | TypeScript                              | 5.x             | Latest stable                                                   |
| Testing              | Vitest                                  | 3.x             | Current stable                                                  |

> **Note on version pinning:** Pin to the minor version in `package.json` (e.g. `"next": "~15.2.0"`). The versions in this table are correct as of PRD date. Do not assume version numbers — verify against npm before starting.

> **Octokit note:** `@octokit/rest` does not have a `createPullRequest` convenience method. Use the lower-level `pulls.create()` method for PR creation.

---

## 7. Project Scope: Greenfield Only (MVP)

MVP supports greenfield projects only — new repositories created specifically for the project. Linking an existing mature codebase is explicitly out of scope for MVP.

**Rationale:** Pablo's PRD authoring and Viktor's TDD implementation assume a blank slate. Ingesting and reasoning about an existing large codebase requires a separate "Repo Archaeology" mode (Pablo reads the repo, summarises architecture, reverse-engineers a PRD) which is a distinct product feature.

**Post-MVP:** A "Brownfield Mode" where Pablo ingests an existing repo and reverse-engineers a PRD from the codebase is a Phase 2 feature.

---

## 8. Data Model

### Auth.js Managed Tables

These tables are created and managed by the `@auth/drizzle-adapter`. Use the adapter's schema definitions as the source of truth. Do not modify their column structure.

```
users                           (managed by Auth.js)
  id, name, email, emailVerified, image

accounts                        (managed by Auth.js)
  id, userId, type, provider, providerAccountId
  access_token, refresh_token, expires_at, token_type, scope

sessions                        (managed by Auth.js)
  id, sessionToken, userId, expires

verification_tokens             (managed by Auth.js)
  identifier, token, expires
```

### Application Tables

```
Project
  id                  uuid, primary key
  userId              references users.id
  name                text, not null
  description         text, nullable
  githubRepo          text, not null  -- e.g. "alecburrett/my-app" (1:1 with repo)
  defaultBranch       text, default "main"
  status              enum: active | archived
  createdAt           timestamp
  updatedAt           timestamp

  Constraints:
    UNIQUE (userId, githubRepo)

  → has one: Requirements (project-level artifact)
  → has one: PRD         (project-level artifact)
  → has many: Sprints

Sprint
  id                  uuid, primary key
  projectId           references Project.id
  number              integer, not null  -- 1, 2, 3...
  goal                text  -- sprint goal statement
  status              enum: planning | development | review | qa | deploying | complete
  featureBranch       text, nullable  -- e.g. "sprint-3-user-auth"
  prUrl               text, nullable  -- GitHub PR URL once opened
  deployUrl           text, nullable  -- production deploy URL once live
  createdAt           timestamp
  completedAt         timestamp, nullable

  Constraints:
    UNIQUE (projectId, number)

  → has many: Stories
  → has many: AgentTasks
  → has many: Artifacts
  → has many: Conversations

Story
  id                  uuid, primary key
  sprintId            references Sprint.id
  title               text, not null
  description         text
  points              integer  -- story point estimate
  status              enum: todo | in_progress | done
  acceptanceCriteria  text  -- markdown
  sortOrder           integer  -- ordering within sprint

AgentTask
  id                  uuid, primary key
  projectId           references Project.id
  sprintId            references Sprint.id, nullable
  stage               text  -- which workflow stage triggered this task
  persona             enum: pablo | stella | viktor | rex | quinn | dex | max
  status              enum: pending | running | completed | failed | cancelled
  tokenUsage          jsonb  -- { inputTokens: number, outputTokens: number }
  tokenBudget         integer, default 100000  -- max input+output tokens
  input               jsonb  -- task parameters (see AgentTask Input Shapes below)
  output              jsonb  -- final result (see AgentTask Output Shapes below)
  error               text, nullable  -- error message if failed or cancelled
  sessionId           text, unique  -- used for SSE reconnection
  startedAt           timestamp, nullable
  completedAt         timestamp, nullable
  createdAt           timestamp

Artifact
  id                  uuid, primary key
  projectId           references Project.id
  sprintId            references Sprint.id, nullable  -- null if project-level
  type                enum: requirements | prd | sprint-plan | test-report | review | retro | deploy-record
  status              enum: current | superseded  -- superseded when step-back or re-run occurs
  content             text  -- markdown
  commitSha           text, nullable  -- GitHub commit SHA when committed
  createdAt           timestamp
  updatedAt           timestamp

  Note: Versioning is handled by creating new Artifact records and marking
  the previous one as superseded. Git history provides the full version trail.
  The current artifact for a given (projectId, sprintId, type) is the one
  with status = 'current'.

Conversation
  id                  uuid, primary key
  projectId           references Project.id
  sprintId            references Sprint.id, nullable
  stage               enum: requirements | prd | planning | development | review | qa | deploy | retro
  persona             enum: pablo | stella | viktor | rex | quinn | dex | max
  messages            jsonb  -- MessageRecord[] (see below)
  createdAt           timestamp

  Note: messages is a JSON array for MVP. For Phase 2, when conversation
  history grows long across multi-sprint projects, this should be extracted
  to a separate messages table with pagination support.
```

### AgentTask Input/Output Shapes

Each persona's `AgentTask.input` and `AgentTask.output` follow specific shapes:

```ts
// packages/types/src/agent-task.ts

// --- Input shapes (sent to agent service) ---

type PabloInput = {
  persona: 'pablo'
  stage: 'requirements' | 'prd'
  projectId: string
  conversationHistory: MessageRecord[]       // prior conversation turns
  existingRequirements?: string              // for PRD stage: approved requirements content
}

type StellaInput = {
  persona: 'stella'
  stage: 'planning' | 'retro'
  projectId: string
  sprintId: string
  prdContent: string                         // current PRD markdown
  priorRetro?: string                        // previous sprint retro content
  carryForwardStories?: StoryRecord[]        // unfinished stories from prior sprint
}

type ViktorInput = {
  persona: 'viktor'
  stage: 'development'
  projectId: string
  sprintId: string
  stories: StoryRecord[]                     // stories for this sprint
  sprintPlan: string
  featureBranch: string                      // branch to commit to
  githubRepo: string                         // e.g. "alecburrett/my-app"
  githubToken: string                        // user's OAuth token for git push + GitHub API
}

type RexInput = {
  persona: 'rex'
  stage: 'review'
  projectId: string
  sprintId: string
  prUrl: string
  prdContent: string
  sprintPlan: string
  githubRepo: string
  githubToken: string                        // for PR creation via Octokit
}

type QuinnInput = {
  persona: 'quinn'
  stage: 'qa'
  projectId: string
  sprintId: string
  featureBranch: string
  githubRepo: string
  githubToken: string                        // for repo operations
  testReportFromReview?: string              // Rex's review findings for context
}

type DexInput = {
  persona: 'dex'
  stage: 'deploy'
  projectId: string
  sprintId: string
  githubRepo: string
  featureBranch: string
  defaultBranch: string
  githubToken: string                        // for Actions workflow commit + status polling
}

type AgentTaskInput =
  | PabloInput | StellaInput | ViktorInput
  | RexInput   | QuinnInput  | DexInput

// --- Output shapes (returned from agent service) ---

type AgentTaskOutput = {
  summary: string                            // human-readable summary of what was done
  artifactsCreated: string[]                 // artifact IDs created during this task
  storiesUpdated?: { storyId: string; newStatus: StoryStatus }[]
  errors?: string[]                          // non-fatal errors encountered
}

// --- MessageRecord (used in Conversation.messages) ---

type MessageRecord = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string                          // ISO 8601
  persona?: string                           // which persona sent this (for assistant messages)
  toolCalls?: {
    toolName: string
    input: Record<string, unknown>
    output?: string
    approved?: boolean                       // for approval-gated tools
  }[]
}
```

---

## 9. Error Handling

### Error Handling Philosophy

Errors are surfaced to the user immediately, in context, with a clear recovery action. The system never silently swallows errors or leaves the user guessing.

### Error Categories & Recovery

| Error Category           | Example                                          | User-Facing Behaviour                                                                         | Recovery Action                                |
| ------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **GitHub API failure**   | API down, rate limited, auth token expired        | Terminal panel shows red error with context. Stage pauses.                                     | "Retry" button. If auth expired, re-auth flow. |
| **Anthropic API failure**| 500, 529 (overloaded), rate limited               | Terminal panel shows amber warning. Agent retries up to 3 times with exponential backoff.      | Auto-retry. After 3 failures: "Retry" or "Cancel". |
| **Agent service restart**| Railway deploy during in-flight task              | Task status set to `failed` with `error: 'Agent service restarted'`.                          | "Restart task" button. Partial commits preserved. |
| **Tool execution error** | Test runner crashes, bash command fails            | Tool output shows error in terminal panel. Viktor/Quinn sees it and adapts.                   | Agent self-recovers. If stuck, user can cancel. |
| **GitHub Actions failure**| CI/CD pipeline fails during deploy               | Deploy log streamed to terminal. Dex diagnoses.                                                | Dex proposes fix. User can step back to QA.    |
| **Token budget exceeded**| Viktor's task exceeds 100k tokens                 | Amber warning at 80%. Auto-cancel at 100%.                                                    | "Increase budget and resume" or "Cancel".      |
| **Concurrent limit hit** | User starts 4th task while 3 are running          | HTTP 429 → UI shows: "3 tasks already running. Please wait for one to complete."              | Automatic retry when slot opens.               |
| **Network timeout**      | Browser loses connection to agent SSE stream      | Connection indicator turns amber. Auto-reconnect with backoff.                                | Automatic reconnection. Manual "Reconnect" fallback. |
| **Git conflict**         | Parallel lane merge conflict (Max)                | Max reports the conflict in the terminal. Affected files listed.                              | Max attempts auto-resolution. If unresolvable, Viktor is looped in. |

### Anthropic API Retry Policy

```ts
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,    // 1 second
  maxDelay: 30000,    // 30 seconds
  backoffMultiplier: 2,
  retryableStatuses: [429, 500, 502, 503, 529],
}
```

Retries are logged as `retry` SSE events in the terminal panel (dim text: "Retrying API call (attempt 2/3)…").

---

## 10. Open Source & Self-Hosting

| Component     | Cloud            | Self-hosted                           |
| ------------- | ---------------- | ------------------------------------- |
| Web app       | Railway          | Docker or any Node.js host            |
| Agent service | Railway          | Docker or any persistent Node.js host |
| Database      | Railway Postgres | Any Postgres (Docker, Neon, etc.)     |
| Auth          | Auth.js v5       | Same — it's just an npm package       |
| CI/CD         | GitHub Actions   | GitHub Actions (free for open source) |

**Required env vars:**

```bash
# Database (Railway provides this automatically)
DATABASE_URL=

# Auth.js
AUTH_SECRET=           # random string: openssl rand -hex 32
AUTH_URL=              # e.g. https://your-app.up.railway.app

# GitHub OAuth App
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Anthropic
ANTHROPIC_API_KEY=

# Internal
AGENT_SERVICE_URL=     # URL of the Railway agent service
AGENT_SERVICE_SECRET=  # Shared secret for web→agent auth (Bearer token)
```

---

## 11. UI/UX

### Layout

- **Left sidebar:** Project list, new project CTA
- **Main area:** Stage workspace — conversation (left 60%) + artifact panel (right 40%)
- **Top bar:** Sprint progress indicator (7 stages), current stage highlighted. Requirements and PRD stages shown as a pre-sprint flow above the progress bar for new projects only.
- **Terminal panel:** Slides up from bottom during Max/Viktor stages, collapsible to status bar

### Stage Navigation

- **Completed:** clickable, read-only review
- **Current:** active workspace
- **Future:** locked with descriptive tooltip
- **"Step back":** always available to the immediately prior stage, requires confirmation modal explaining what will be reset

### Handoff Moment (the ceremony)

- Outgoing persona: "Handing off to Max — the sprint plan is locked."
- Animated card with incoming persona's avatar + colour accent
- Incoming persona's intro line in their voice
- Incoming persona's conversation starts streaming immediately
- Total transition ≤ 1.5 seconds before message streaming begins; skippable by clicking the card
- Claude API call initiated before animation completes — no blocking

### Persona Colour System

| Persona | Colour        | Hex     |
| ------- | ------------- | ------- |
| Pablo   | Warm amber    | #F59E0B |
| Stella  | Sage green    | #6B9E6B |
| Viktor  | Cool blue     | #3B82F6 |
| Rex     | Deep purple   | #7C3AED |
| Quinn   | Coral         | #F97316 |
| Dex     | Electric teal | #06B6D4 |
| Max     | Warm slate    | #64748B |
| Coach   | Gold          | #EAB308 |

### Terminal Panel (Viktor stage)

Dark background, monospace font (JetBrains Mono or similar). Event-type styling:

- `▶ tool_call`: accent colour prefix, tool name
- Tool input params: dim, streaming in
- `tool_output`: white, standard terminal
- File write: green with filename
- Test pass/fail: green ✓ / red ✗ with test name
- Git op: blue accent
- Error: red with context
- Approval gate: amber banner with pending operation and Approve / Reject buttons
- Context summary: dim text — "Context summarised at ~72k tokens"
- Retry: dim text — "Retrying API call (attempt 2/3)…"

### Sprint Board

- Kanban strip above terminal: To Do → In Progress → Done
- Story cards move in real time as Viktor works through them
- Story point totals visible, satisfying Done animation
- Visible throughout Development and QA stages

### Scrum Language Throughout

- "Sprint 3 of Project X"
- "Velocity: 21 points"
- Stage names: Sprint Planning, Development, Sprint Review, Retrospective
- Stella announces ceremonies: "Let's kick off Sprint Planning!"

---

## 12. MVP Scope

### In Scope

- GitHub OAuth via Auth.js v5
- Create projects linked to a GitHub repo (1:1)
- Full sprint workflow (6 stages) for new and returning projects
- Pre-sprint Requirements + PRD flow (Pablo) for new projects
- Returning user flow: start Sprint N+1 from retro or project dashboard
- All 7 core personas, in-character, with correct underlying skills
- Real-time SSE streaming at every stage (Anthropic SDK)
- Terminal panel with tool use streaming (Viktor stage)
- Human-in-the-loop approval gates for file writes, commits, pushes
- Agent task cancellation
- Agent task reconnection (browser disconnect recovery, in-memory buffer)
- Cost guard: token budget per task + concurrency limit per user + budget exhaustion UX
- Context window management via rolling summarisation
- Agent service filesystem model: fresh clone per task into `/tmp/scrumbs/{taskId}/`
- GitHub integration: branches, commits, PRs, Actions status
- Artifact storage: Railway Postgres (via Drizzle) + committed to repo, with current/superseded versioning
- Handoff animations between personas
- Sprint board during Development + QA stages
- Multi-sprint projects (Sprint 1 → Sprint 2 → …)
- Error handling: GitHub API, Anthropic API, agent restart, tool errors, budget, concurrency
- Web → agent service auth via shared secret Bearer token

### Out of Scope (Post-MVP)

- Parallel agent execution (Max's parallel lanes, up to 3 concurrent, via git worktrees)
- Mobile-responsive layout
- Coach persona + custom skill creation
- Multi-user / team collaboration
- Billing + subscription tiers
- Full Claude Code CLI subprocess
- MCP server support in terminal
- Slack / Jira / Linear integrations
- Per-project GitHub Actions template selection
- Analytics / velocity tracking dashboard
- Brownfield / existing repo ingestion mode
- In-app rich text artifact editing (artifacts are read-only with "Edit in GitHub" link)
- Durable event store (Redis/Postgres) for agent reconnection across service restarts
- node_modules caching between agent tasks
- Separate messages table for conversation pagination
- Turborepo build orchestration

---

## 13. User Stories & Definitions of Done

Stories are ordered by dependency. Each story is scoped to a single focused implementation unit.

---

### Epic 1 — Authentication & Project Shell

---

#### US-01: GitHub OAuth Login

> As a developer, I want to sign in with my GitHub account so that I can access my projects and Scrumbs can interact with my repositories.

**Acceptance Criteria:**

- "Continue with GitHub" button visible on the landing/login page for unauthenticated users
- Clicking initiates the GitHub OAuth flow with `read:user repo` scopes
- Successful auth creates a user record in Postgres (if new) and establishes a session
- GitHub access token stored encrypted in the `accounts` table in Postgres (not in JWT payload)
- Failed/cancelled OAuth returns to login page with an error message
- Authenticated users are redirected to their project dashboard
- Session persists across browser restarts (cookie-based)

**Definition of Done:**

- [ ] Auth.js v5 configured with GitHub provider and Drizzle adapter
- [ ] Auth.js managed tables (`users`, `accounts`, `sessions`, `verification_tokens`) created via Drizzle migration
- [ ] GitHub access token retrievable server-side in Next.js server components and API routes via `auth()`
- [ ] GitHub token NOT present in JWT payload or cookie value
- [ ] Middleware redirects all `/dashboard/*` routes to login if unauthenticated
- [ ] E2E test: full OAuth flow completes and lands on dashboard
- [ ] Unit test: unauthenticated request to protected route returns 401/redirect

---

#### US-02: Create a New Project

> As a developer, I want to create a new Scrumbs project linked to a GitHub repository so that I have a workspace for my sprint workflow.

**Acceptance Criteria:**

- "New Project" CTA visible on the dashboard
- User provides: project name, selects or enters a GitHub repo (org/name format)
- System validates that the GitHub repo exists and the user has write access
- If the repo doesn't exist, user can choose to have it created (public or private)
- A `Project` record is created in Postgres linked to the authenticated user
- User is taken to the new project's workspace, pre-sprint flow (Pablo / Requirements)
- One project per repo enforced — attempting to link an already-linked repo shows an error

**Definition of Done:**

- [ ] `projects` table created and migrated
- [ ] GitHub API call validates repo existence and user write access before creation
- [ ] Repo creation via GitHub API works for both public and private repos
- [ ] Unique constraint on `(userId, githubRepo)` enforced at DB and API layer
- [ ] Project appears in sidebar on creation
- [ ] Unit test: duplicate repo link attempt returns appropriate error
- [ ] Unit test: invalid repo name format is rejected before API call

---

#### US-03: Project Dashboard & Sidebar Navigation

> As a developer, I want to see all my projects in a sidebar and navigate between them so that I can manage multiple active projects.

**Acceptance Criteria:**

- Left sidebar lists all user's projects by name
- Each project shows its current sprint number and stage (e.g. "Sprint 2 · Development")
- Clicking a project navigates to that project's current active stage
- "New Project" CTA always visible at the bottom of the sidebar
- Archived projects hidden by default, accessible via a toggle
- Active project highlighted in sidebar
- For projects with a completed sprint: "New Sprint" action available in project context menu

**Definition of Done:**

- [ ] Sidebar renders server-side from Postgres query filtered by `userId`
- [ ] Sprint status label correctly reflects current sprint stage
- [ ] Navigation preserves scroll position in sidebar
- [ ] Empty state shown when user has no projects
- [ ] Archived projects filter works
- [ ] "New Sprint" action creates a new Sprint record and navigates to Sprint Planning

---

### Epic 2 — New Project Flow (Pablo)

---

#### US-04: Requirements Gathering (Pablo)

> As a developer, I want to describe my project to Pablo in a conversational flow so that he captures my requirements in a structured document.

**Acceptance Criteria:**

- Pablo's persona is introduced with handoff card animation on project creation
- Pablo opens with a contextual first message asking about the project
- User and Pablo exchange messages in the conversation panel
- Pablo asks clarifying questions about: target users, core features, constraints, tech preferences
- When Pablo has enough information, he generates a structured Requirements document
- Requirements document renders in the artifact panel as formatted markdown
- User can continue the conversation to refine the requirements
- "Approve Requirements" button confirms the document and unlocks the PRD stage

**Definition of Done:**

- [ ] `AgentTask` record created with `persona: 'pablo'`, `stage: 'requirements'`, input matching `PabloInput` shape
- [ ] SSE stream from agent service renders Pablo's messages in real-time
- [ ] Requirements document appears in artifact panel when Pablo signals completion
- [ ] `Artifact` record with `type: 'requirements'`, `status: 'current'` written to Postgres on approval
- [ ] Requirements document committed to GitHub repo with `commitSha` stored
- [ ] Conversation messages persisted to `conversations` table
- [ ] Unit test: Pablo system prompt includes requirements-ingestion skill content
- [ ] Integration test: agent task reaches `completed` status after approval

---

#### US-05: PRD Authoring (Pablo)

> As a developer, I want Pablo to generate a PRD from the approved requirements so that I have a structured specification to drive sprint planning.

**Acceptance Criteria:**

- PRD stage begins automatically after Requirements are approved
- Pablo generates a PRD with: overview, user personas, feature list with priorities, out-of-scope items
- PRD renders in the artifact panel
- User can request changes via conversation ("Add a section on…", "Remove X feature")
- Pablo updates the PRD in response to feedback
- "Approve PRD" button finalises the PRD, commits `docs/PRD.md` to the GitHub repo, and unlocks Sprint Planning
- Committed file is accessible at the linked GitHub repo URL

**Definition of Done:**

- [ ] PRD uses approved Requirements artifact as context in Pablo's system prompt via `PabloInput.existingRequirements`
- [ ] `Artifact` record with `type: 'prd'`, `status: 'current'` written to Postgres on approval
- [ ] `docs/PRD.md` committed to the linked GitHub repo via `octokit.rest.repos.createOrUpdateFileContents()` with `commitSha` stored
- [ ] User can verify the commit exists on GitHub via the link in the artifact panel
- [ ] PRD artifact is read-only in-app; "Edit in GitHub" link opens the file in GitHub web editor
- [ ] Re-running the PRD stage marks the previous artifact as `superseded` and creates a new `current` artifact
- [ ] Unit test: Octokit commit call is made with correct file path and content

---

### Epic 3 — Sprint Planning (Stella)

---

#### US-06: Sprint Planning Ceremony (Stella)

> As a developer, I want Stella to break the PRD backlog into a sprint plan so that Viktor has a clear set of stories to implement.

**Acceptance Criteria:**

- Stella is introduced via handoff animation (from Pablo on Sprint 1, from previous Retro on Sprint N+1)
- Stella reads the PRD + any backlog carry-forwards from previous sprints
- For Sprint N+1: Stella also reads the previous sprint's retro notes
- Stella proposes: sprint goal, user stories with acceptance criteria, story point estimates
- Stories rendered as cards in the conversation; artifact panel shows the sprint plan
- User can request changes: add/remove/resize stories
- "Approve Sprint Plan" confirms the plan; feature branch is automatically created; sprint transitions to `'development'`
- `Sprint.status` advances from `'planning'` to `'development'` on approval
- Sprint plan committed to repo as `sprints/sprint-N.md`

**Definition of Done:**

- [ ] Stella's system prompt includes the PRD artifact, any prior sprint retro artifacts, and carry-forward stories via `StellaInput`
- [ ] `Sprint` record created with correct `number`, `goal`, and `status: 'planning'`
- [ ] `Story` records created for each story in the sprint plan
- [ ] Sprint plan committed to GitHub as `sprints/sprint-N.md` with `commitSha` stored
- [ ] Feature branch created automatically via Octokit on plan approval; `Sprint.featureBranch` set in Postgres
- [ ] `Sprint.status` transitions to `'development'` on approval (validated against state machine)
- [ ] Backlog carry-forwards from prior sprints included in Stella's context
- [ ] Unit test: story point sum is surfaced in artifact panel
- [ ] Unit test: branch creation failure handled gracefully with error message

---

### Epic 4 — Development (Viktor)

---

#### US-07: TDD Implementation (Viktor)

> As a developer, I want Viktor to implement sprint stories in order using test-driven development so that each feature is built with tests written before code.

**Acceptance Criteria:**

- Viktor is introduced via handoff animation (Max delivers a brief "branch ready" sign-off)
- Terminal panel slides up from the bottom of the layout
- Viktor's tool calls stream in real-time in the terminal panel with correct event-type styling
- Viktor writes failing tests before any implementation code (red → green enforced)
- File writes, git commits, and git pushes pause for user approval before executing
- Approval prompt appears in the terminal panel (amber banner) with the pending operation clearly described
- User approves or rejects; rejection returns signal to Viktor who must revise
- Stories move from "To Do" to "In Progress" to "Done" on the sprint kanban strip in real-time
- Context window management active: rolling summarisation triggers when messages exceed ~72k tokens
- On completion, Viktor summarises what was built; sprint advances to `status: 'review'`

**Terminal Panel Event Styling:**

- `tool_call`: accent colour prefix, tool name and params streaming in
- `tool_output`: white text, standard terminal style
- File write: green with filename
- Test pass: green ✓ with test name; test fail: red ✗ with test name
- Git operations: blue accent
- Errors: red with context
- Approval gate: amber banner with Approve / Reject buttons
- Context summary: dim text indicator
- API retry: dim text with attempt count

**Definition of Done:**

- [ ] Agent service clones the GitHub repo fresh per task into `/tmp/scrumbs/{taskId}/`, installs dependencies, then proceeds
- [ ] `AgentTask` for Viktor created with `ViktorInput` shape (including `githubToken`), tracked, transitions `pending → running → completed`
- [ ] SSE stream renders tool events in terminal panel in real-time
- [ ] Approval gate pauses SSE stream and renders approval UI in terminal panel
- [ ] Approval/rejection POSTed to `POST /tasks/:id/approve`; agent resumes or revises accordingly
- [ ] Rejected tool calls do not execute — Viktor receives rejection as tool result
- [ ] Story status updates in real-time via separate SSE events
- [ ] Sprint kanban shows story movement in real-time
- [ ] All commits made to the sprint feature branch (never to main/default)
- [ ] Context window summarisation triggers correctly and emits `context_summary` SSE event
- [ ] Unit test: file write tool does not execute until approval signal received
- [ ] Unit test: test failure event renders with red ✗ styling in terminal panel

---

#### US-08: Agent Task Reconnection

> As a developer, if my browser disconnects mid-task, I want to reconnect to the running agent stream so that I don't lose progress or leave agents running unmonitored.

**Acceptance Criteria:**

- On reconnection (page reload, tab restore), the UI detects any `running` agent tasks for the current sprint
- Reconnection automatically resumes the SSE stream using the existing `sessionId`
- Terminal panel re-renders events already emitted (from the agent service in-memory event buffer)
- Pending approval gates re-surface if the agent is paused waiting for approval
- If the agent completed while disconnected, the terminal panel shows the full completed output
- If the agent service restarted while disconnected, the task shows `status: 'failed'` with a "Restart task" option

**Definition of Done:**

- [ ] Agent service buffers all emitted events in memory indexed by `sessionId`
- [ ] `GET /tasks/:id/stream` with existing `sessionId` replays buffered events then continues live
- [ ] Browser reconnection logic detects `running` tasks on page load and initiates reconnect
- [ ] Pending approval state is restored correctly after reconnect
- [ ] Agent service restart scenario handled — task marked `failed`, UI offers restart
- [ ] Unit test: reconnect to a completed task returns full event history and `done` signal

---

#### US-09: Agent Task Cancellation

> As a developer, I want to cancel a running agent task so that I can stop Viktor if he's heading in the wrong direction.

**Acceptance Criteria:**

- "Cancel" button visible in the terminal panel whenever an agent task is running
- Clicking shows a confirmation: "Cancel current task? Partial work will be preserved."
- On confirmation, a cancellation signal is sent to the agent service
- Agent service aborts the Claude API stream and stops tool execution at the next safe point (after any in-progress tool call completes)
- No further approval gates appear after cancellation
- `AgentTask.status` updates to `'cancelled'`; `AgentTask.completedAt` is set
- Terminal panel shows a "Task cancelled" message
- Sprint status remains at `'development'` — user can restart Viktor or adjust the sprint plan
- Partial commits already made remain on the feature branch (not rolled back)

**Definition of Done:**

- [ ] `POST /tasks/:id/cancel` endpoint on agent service
- [ ] Agent service honours cancellation signal before the next tool call
- [ ] `AgentTask.status` transitions to `'cancelled'` and `completedAt` set
- [ ] Partial commits remain on the feature branch — no automatic rollback
- [ ] "Restart Viktor" option offered after cancellation
- [ ] Unit test: cancellation signal stops execution after current tool call and before the next

---

### Epic 5 — Code Review (Rex)

---

#### US-10: PR Creation & Code Review (Rex)

> As a developer, I want Rex to create a PR for the sprint branch and review the code against the sprint plan so that quality issues are caught before QA.

**Acceptance Criteria:**

- Rex is introduced via handoff animation from Viktor
- Rex opens a GitHub PR from the sprint feature branch to the default branch via `octokit.rest.pulls.create()`
- Rex reviews: PR diff vs PRD, sprint plan adherence, test coverage, code quality
- Findings issued in three categories: 🔴 Critical / 🟡 Let's Improve This / 🟢 Minor Suggestion
- Review rendered in artifact panel with findings listed by severity
- 🔴 Critical findings block progression to QA; Viktor is looped in to fix (sprint status transitions `review → development`)
- 🟡 and 🟢 findings are advisory; user can choose to address or skip
- "Approve PR" transitions sprint to `status: 'qa'`

**Definition of Done:**

- [ ] GitHub PR created via `octokit.rest.pulls.create()`; `Sprint.prUrl` updated in Postgres
- [ ] PR diff fetched and passed as context in Rex's review prompt via `RexInput`
- [ ] Review findings rendered with colour-coded severity in artifact panel
- [ ] Critical findings block the "Proceed to QA" action until resolved
- [ ] Non-critical findings dismissible with a reason
- [ ] Critical fix transitions sprint `review → development` (validated against state machine) and creates a new Viktor `AgentTask`
- [ ] `Artifact` record with `type: 'review'` created and committed to repo
- [ ] Unit test: PR with zero critical findings allows immediate QA progression

---

### Epic 6 — QA (Quinn)

---

#### US-11: QA Sign-Off (Quinn)

> As a developer, I want Quinn to run the full test suite and identify coverage gaps so that I can be confident before deploying.

**Acceptance Criteria:**

- Quinn is introduced via handoff animation from Rex
- Quinn runs the full test suite against the sprint branch
- Test results stream in the terminal panel (pass ✓ / fail ✗ per test)
- Quinn identifies: test failures, untested edge cases, coverage gaps
- Test failures require Viktor to fix before QA sign-off (sprint status transitions `qa → development`)
- Quinn generates a QA sign-off report when all tests pass
- "QA Sign-Off" advances sprint to `status: 'deploying'`

**Definition of Done:**

- [ ] Quinn's agent runs tests via bash tool; output streams to terminal panel
- [ ] Test pass/fail parsed from test runner output and rendered with correct styling
- [ ] Test failures transition sprint `qa → development` (validated against state machine) and loop Viktor in
- [ ] `Artifact` record with `type: 'test-report'` created with full test output
- [ ] `Sprint.status` advances to `'deploying'` only when all tests pass
- [ ] Unit test: partial test failure blocks QA sign-off and surfaces correct failure list

---

### Epic 7 — Deploy (Dex)

---

#### US-12: CI/CD Pipeline Generation & Deploy (Dex)

> As a developer, I want Dex to trigger the GitHub Actions pipeline and guide me through deploying to production so that my sprint ships.

**Acceptance Criteria:**

- Dex is introduced via handoff animation from Quinn
- Dex asks: "Where are we deploying? Railway or Vercel?" (with custom as escape hatch)
- Dex generates the appropriate GitHub Actions workflow file if one doesn't exist and commits it
- Dex triggers the pipeline and streams its status in the terminal panel
- Preview deploy URL surfaced for user review before production deploy
- User explicitly approves production deploy
- On success: `Sprint.deployUrl` updated, `Artifact` with `type: 'deploy-record'` created
- Sprint status advances to `status: 'complete'`
- On failure: deploy error displayed, sprint status transitions `deploying → qa` for diagnosis

**Definition of Done:**

- [ ] GitHub Actions workflow file committed to repo via Octokit if not present
- [ ] GitHub Actions run status polled via Octokit and streamed to terminal panel
- [ ] Preview URL rendered before production approval step
- [ ] Production deploy requires explicit user approval (not implicit)
- [ ] `Sprint.deployUrl` and `Sprint.status: 'complete'` updated on success (validated against state machine)
- [ ] Deploy failure transitions sprint `deploying → qa` with error context
- [ ] Deploy failure renders error from GitHub Actions log in terminal panel
- [ ] `Artifact` record with deploy URL created and committed
- [ ] Unit test: production deploy step blocked until preview approval given

---

### Epic 8 — Retrospective (Stella)

---

#### US-13: Sprint Retrospective (Stella)

> As a developer, I want Stella to run a retrospective so that learnings are captured and the backlog is updated for the next sprint.

**Acceptance Criteria:**

- Stella is introduced via handoff animation from Dex
- Stella summarises: what shipped, story points delivered vs planned (velocity), what took longer
- Stella identifies backlog items to carry forward (any stories not completed)
- User can add notes or topics to the retrospective
- Retrospective committed to repo as `sprints/sprint-N-retro.md`
- "Start Sprint N+1" CTA visible; clicking creates a new Sprint record and returns to Sprint Planning with Stella reading the retro

**Definition of Done:**

- [ ] Stella's retro prompt includes sprint plan, completed stories, and QA/deploy artifacts as context via `StellaInput`
- [ ] `Artifact` record with `type: 'retro'` created and committed to `sprints/sprint-N-retro.md`
- [ ] Carry-forward stories persisted as `Story` records with `status: 'todo'`; linked to new sprint on Sprint N+1 creation
- [ ] Velocity (points planned vs delivered) calculated and displayed
- [ ] "Start Sprint N+1" creates a new `Sprint` record with correct `number` and navigates to Sprint Planning
- [ ] Unit test: carry-forward stories appear in Stella's Sprint N+1 planning context via `StellaInput.carryForwardStories`

---

### Epic 9 — Returning User Flow

---

#### US-14: Start a New Sprint on an Existing Project

> As a developer returning to an existing project, I want to start a new sprint so that I can continue building on what I've shipped.

**Acceptance Criteria:**

- Entry points: "Start Sprint N+1" CTA on the retro page, or "New Sprint" in the project sidebar context menu
- System verifies the previous sprint is in `status: 'complete'` before allowing a new sprint (if a sprint is in progress, the user is taken to its current stage instead)
- New Sprint record created with `number` incremented from the previous sprint
- Stella is introduced and reads: the current PRD, the previous sprint's retro notes, and any carry-forward stories
- Flow proceeds through the standard 6-stage sprint cycle
- Pablo is not involved unless the user explicitly requests a PRD update

**Definition of Done:**

- [ ] "New Sprint" creates a `Sprint` record with `status: 'planning'` and correct `number`
- [ ] Guard: cannot create a new sprint if a sprint is already in `planning` through `deploying` status
- [ ] Stella's `StellaInput` includes `priorRetro` and `carryForwardStories` from the previous sprint
- [ ] Previous sprint's retro artifact loaded as context for Stella
- [ ] Unit test: attempting to create Sprint 3 while Sprint 2 is in `development` redirects to Sprint 2

---

### Epic 10 — Cross-Cutting

---

#### US-15: Real-Time Stage Progress Indicator

> As a developer, I want to see the sprint's current stage highlighted in a top progress bar so that I always know where I am in the workflow.

**Acceptance Criteria:**

- 6-stage progress bar at top of main workspace: Planning → Development → Review → QA → Deploy → Retro
- For new projects: Requirements and PRD shown as a pre-sprint indicator above the progress bar (completed once, then hidden)
- Current stage highlighted; completed stages clickable for read-only review
- Future stages greyed out with descriptive tooltip on hover
- "Step back" available at any stage to the immediately prior stage (per state machine) with a confirmation modal

**Definition of Done:**

- [ ] Progress bar renders server-side from `Sprint.status`
- [ ] Pre-sprint indicator visible for projects where PRD stage was completed in this session
- [ ] Completed stage views are fully read-only (no active inputs)
- [ ] "Step back" confirmation modal explains what will be reset (current stage's artifacts marked as `superseded`)
- [ ] "Step back" reverts `Sprint.status` to the immediately prior stage only (validated against state machine)

---

#### US-16: Persona Handoff Animation

> As a developer, I want to see an animated handoff card when work passes between personas so that the workflow feels like a real team passing a baton.

**Acceptance Criteria:**

- Outgoing persona delivers a contextual sign-off line in their voice
- Animated card slides in with incoming persona's name, colour accent, and role
- Incoming persona's opening message begins streaming immediately after the card settles
- Total transition ≤ 1.5 seconds before message streaming begins
- Animation is skippable by clicking anywhere on the card

**Definition of Done:**

- [ ] Handoff animation component implemented with persona colour system applied correctly
- [ ] Each persona has a defined sign-off line and opening line per stage context
- [ ] Animation duration ≤ 1.5 seconds before message streaming begins
- [ ] Skip-by-click shows incoming persona's message area immediately
- [ ] Claude API call initiated before animation completes — no blocking on animation

---

#### US-17: Cost Guard & Rate Limiting

> As a system operator, I want agent tasks to have a token budget and the agent service to be rate-limited so that runaway agents don't incur uncontrolled API costs.

**Acceptance Criteria:**

- Each agent task has a configurable max token budget (default: 100k tokens input+output)
- Agent service enforces a max of 3 concurrent tasks per user
- At 80% budget usage: amber warning in terminal panel
- Tasks exceeding their token budget are automatically cancelled with a clear error message
- On budget cancellation: user offered "Increase budget and resume" (doubles budget, restarts with context summary) or "Cancel"
- Rate limiting returns HTTP 429 with `Retry-After` header
- Token usage for each `AgentTask` logged in Postgres per loop iteration

**Definition of Done:**

- [ ] `AgentTask.tokenUsage` field (`inputTokens`, `outputTokens`) and `tokenBudget` in schema
- [ ] Token budget check implemented in agent loop — 80% warning emitted, task cancelled at 100%
- [ ] `AgentTask.status` transitions to `'cancelled'` with `error: 'Token budget exceeded'`
- [ ] "Increase budget and resume" creates a new `AgentTask` with doubled budget and context summary as input
- [ ] Concurrency limit enforced at agent service entry point per `userId`
- [ ] HTTP 429 surfaces as user-facing message in the UI
- [ ] Token usage logged after each tool loop iteration
- [ ] Unit test: task exceeding token budget transitions to `'cancelled'`
- [ ] Unit test: 4th concurrent request from same user receives 429

---

#### US-18: Error Handling & Recovery

> As a developer, I want errors during any stage to be surfaced clearly with recovery options so that I'm never stuck without a way forward.

**Acceptance Criteria:**

- GitHub API errors: terminal panel shows red error with context; "Retry" button offered; expired auth triggers re-auth flow
- Anthropic API errors (429, 500, 502, 503, 529): auto-retry up to 3 times with exponential backoff; after 3 failures: "Retry" or "Cancel" offered
- Agent service restart during in-flight task: task marked `failed`; "Restart task" button shown; partial commits preserved
- Tool execution errors: shown in terminal; agent self-recovers; user can cancel if stuck
- GitHub Actions failures: error log streamed to terminal; Dex diagnoses; user can step back to QA
- Network disconnection: connection indicator turns amber; auto-reconnect with backoff; manual "Reconnect" fallback

**Definition of Done:**

- [ ] Anthropic API retry logic implemented per the retry config (3 retries, exponential backoff, retryable status codes)
- [ ] Retry attempts emit `retry` SSE events visible in terminal panel
- [ ] GitHub API errors caught and surfaced with specific error messages (not generic "something went wrong")
- [ ] Agent service restart detection: task status set to `failed` with descriptive error on reconnect attempt
- [ ] Network disconnection indicator visible in the UI with auto-reconnect behaviour
- [ ] Unit test: Anthropic 529 triggers retry and succeeds on second attempt
- [ ] Unit test: GitHub 401 (expired token) triggers re-authentication flow

---

## 14. SaaS Evolution

**Phase 2 — Parallel Execution & Polish**

- Parallel agent execution (Max's parallel lanes, up to 3 concurrent, via git worktrees)
- Split terminal panels for parallel lanes
- node_modules caching between agent tasks (persistent Railway volume)
- Mobile-responsive layout
- Sprint history view, velocity charts
- Backlog management between sprints
- Pablo available mid-sprint for PRD updates
- Turborepo added as build complexity warrants it
- Durable event store (Redis or Postgres) for agent reconnection across service restarts
- Separate `messages` table for conversation pagination
- Tailwind v4 migration (when shadcn/ui confirms compatibility)

**Phase 3 — Collaboration**

- Team workspaces, shared projects
- Multiple human users on one project

**Phase 4 — Billing**

- Free: 1 active project
- Pro: unlimited projects + Coach persona
- Team: collaboration + shared billing

**Phase 5 — Platform**

- Coach unlocked on Pro (custom personas, skill creation)
- MCP server support in terminal
- Plugin system for new workflow stages
- Enterprise self-hosted option with support
- Brownfield / existing repo ingestion mode

---

## 15. Resolved Decisions

- **GitHub Actions template:** Dex asks during Deploy stage — Railway or Vercel (with custom as escape hatch). Generates the appropriate workflow file. ✅
- **Artifact editing:** Read-only in-app with "Edit in GitHub" link for MVP. In-app rich text editing post-MVP. ✅
- **Artifact versioning:** New artifacts created on re-run; previous marked `superseded`. Git history provides the full version trail. No explicit version number field. ✅
- **Claude model per persona:** All on `claude-sonnet-4-6` for MVP. Rex + Viktor optionally on `claude-opus-4-6` post-MVP. ✅
- **Agent service multi-tenancy:** Single shared Railway agent service for MVP, sessions isolated by `sessionId`. Per-workspace containers for Team tier post-MVP. ✅
- **AI SDK choice:** Anthropic SDK (`@anthropic-ai/sdk`) directly. Vercel AI SDK not used — product is provider-locked to Claude, multi-provider abstraction adds no value, and its agentic agent classes do not exist in any released version. ✅
- **Repo tooling:** npm workspaces for MVP. Turborepo deferred to Phase 2. ✅
- **GitHub token storage:** Encrypted in Postgres `accounts` table via Drizzle adapter. Not stored in JWT. ✅
- **Agent HTTP framework:** Fastify 5.x. SSE via `reply.raw` (not `@fastify/sse`). ✅
- **Validation library:** Zod v3 (stable). Zod v4 deferred until stable release. ✅
- **Tailwind version:** v3 for MVP. v4 deferred until shadcn/ui confirms compatibility. ✅
- **Web → agent auth:** Shared secret as Bearer token in Authorization header. ✅
- **Event buffer durability:** In-memory for MVP. Tasks fail on agent restart; partial commits preserved. Durable store in Phase 2. ✅
- **Parallel execution:** Deferred to Phase 2. MVP is linear only. ✅
- **Dev Setup stage:** Removed. Branch creation is automated on sprint plan approval (Stella triggers it). Max introduces himself briefly at the start of Development. State machine is `planning → development` directly. ✅
- **Mobile-responsive layout:** Deferred to Phase 2. Target user is a developer at a desktop. ✅
- **Agent service filesystem model:** Fresh clone per task into `/tmp/scrumbs/{taskId}/`. Accept the overhead at MVP. Caching is Phase 2. ✅
- **GitHub token in agent service:** Passed in task input (`githubToken` field on all relevant input shapes). Web service retrieves from `accounts` table before creating the task. ✅
- **Token counting:** Character-count heuristic (`tokens ≈ chars / 4`). No `@anthropic-ai/tokenizer` dependency. ✅
- **Conversation storage:** JSON array in `conversations.messages` for MVP. Separate `messages` table in Phase 2. ✅
- **Context window management:** Rolling summarisation at 60% context window capacity using Haiku for summaries. ✅
- **Sprint status transitions:** Explicit state machine (Section 5). Service layer validates all transitions. ✅
- **Octokit PR creation:** Use `octokit.rest.pulls.create()` — no `createPullRequest` convenience method exists. ✅
- **Pre-sprint flow:** Requirements and PRD are pre-sprint stages, not part of the 6-stage sprint progress bar. ✅

---

*End of PRD v1.0*
