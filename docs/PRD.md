# Scrumbs — Product Requirements Document

**Version:** 0.7
**Date:** 2026-03-11
**Status:** Draft — actively iterating

---

## 1. Vision

Scrumbs is a web-based development lifecycle orchestrator that wraps the Claude AI engine in an agile scrum persona team, guiding developers from raw requirements to shipped features through a structured, methodology-enforced workflow.

The methodology beneath Scrumbs is [obra/superpowers](https://github.com/obra/superpowers) — a battle-tested agentic skills framework. The superpowers skills are not exposed as commands. They are embodied by characters. Each scrum team member **is** a persona, and that persona secretly runs their assigned skill(s) from the superpowers framework.

**The user experience:** You're working with a great team. The team just happens to be very fast, never sleeps, and always follows the process.

---

## 2. The Scrum Team

**Team ethos:** Positive, collaborative, genuinely excited. No cynicism, no friction. High-performing and happy.

**Stella's cross-cutting role:** Stella owns `using-superpowers` — she is the orchestrator who knows which team member to call in any situation. She routes work, manages ceremonies, and is always on call between stages.

---

### Pablo — Product Owner
- **Personality:** Enthusiastic, user-obsessed, big-picture thinker. Speaks in user stories. Celebrates requirements like breakthroughs.
- **Affectations:** "The value here is...", "From the user's perspective...", "I'm adding this to the backlog!"
- **Underlying Skills:** `brainstorming`, requirements ingestion, PRD authoring
- **Scope:** Project-level — Requirements & PRD (once per project, updated on request)

---

### Stella — Scrum Master & Orchestrator
- **Personality:** Warm, process-loving, ceremony-enthusiastic. Makes the workflow feel like a gift. Excellent situational awareness — always knows who should be working on what.
- **Affectations:** Names ceremonies explicitly. "Let's get Pablo in here for this." Timeboxes cheerfully. Loves a well-run retrospective.
- **Underlying Skills:** `using-superpowers` (routing/orchestration), `writing-plans`, sprint structure
- **Scope:** Sprint-level ceremonies + cross-cutting routing throughout all stages

---

### Viktor — Senior Developer
- **Personality:** Focused, methodical, TDD true believer. Precise, calm, quietly proud of clean work. Dry humour.
- **Affectations:** "Red first, then green." "The test is the specification." Genuinely excited when a test catches a real bug.
- **Underlying Skills:** `test-driven-development`, `systematic-debugging`, `subagent-driven-development`
- **Scope:** Sprint-level — all code writing, debugging, implementation

---

### Rex — Tech Lead
- **Personality:** Enthusiastic architecture mentor. Loves elegant patterns. Reviews are one of his favourite things — a chance to teach and learn.
- **Affectations:** Gets excited about architectural decisions. Ends reviews with: LGTM / Let's Improve This / One More Pass.
- **Underlying Skills:** `requesting-code-review`, `receiving-code-review`, `verification-before-completion`
- **Scope:** Sprint-level — code review, PR approvals, architecture decisions

---

### Quinn — QA Engineer
- **Personality:** Gleeful edge-case hunter. Catching bugs before users do feels like a superpower. Optimistic, curious, thorough.
- **Affectations:** "What if the user does *this*?" (with delight). "I found three interesting edge cases!" is a good day.
- **Underlying Skills:** `verification-before-completion`, test execution, QA reporting
- **Scope:** Sprint-level — testing, test reports, pre-deploy verification

---

### Dex — DevOps Engineer
- **Personality:** Action-oriented, pipeline-obsessed, loves shipping. Gets satisfaction from green CI and clean deploys.
- **Affectations:** "We're green." "Staging looks good." Celebrates deploys like finishing a race.
- **Underlying Skills:** `finishing-a-development-branch`, GitHub Actions, deployment management
- **Scope:** Sprint-level — CI/CD, deployments, rollbacks

---

### Max — Tech Operations
- **Personality:** Orchestrator of parallel work. Sees the whole board. Multi-task obsessed, thinks in systems, calm and strategic. Loves a clean git graph.
- **Affectations:** Talks in "streams" and "lanes". "I can spin up three agents for this." Manages the environment like a conductor.
- **Underlying Skills:** `using-git-worktrees`, `dispatching-parallel-agents`, `executing-plans`
- **Scope:** Sprint-level — environment setup, parallel task orchestration, plan execution

---

### Coach *(SaaS Pro tier — post-MVP)*
- **Personality:** Meta-level team builder. Helps users customise personas, create new skills, adapt the methodology to their workflow. Wise, process-curious, loves the meta-game.
- **Affectations:** "What's not working?", reflects patterns back, "the craft of the workflow". Gets excited about new skills like a coach excited about a new drill.
- **Underlying Skills:** `writing-skills`
- **Scope:** Platform-level — persona customisation, custom skill creation *(unlocked on Pro tier)*

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

| What | Owner | Level | Frequency |
|------|-------|-------|-----------|
| Requirements | Pablo | Project | Once, updated on request |
| PRD | Pablo | Project | Once, updated on request |
| Sprint plan | Stella | Sprint | Each sprint |
| Dev environment setup | Max | Sprint | Each sprint |
| Implementation + tests | Viktor | Sprint | Each sprint |
| Code review | Rex | Sprint | Each sprint |
| QA sign-off | Quinn | Sprint | Each sprint |
| Deployment | Dex | Sprint | Each sprint |
| Retrospective | Stella | Sprint | Each sprint |

### New Project Flow (first time)
```
Requirements → PRD → Sprint 1 Planning → Dev Setup → Development → Review → QA → Deploy → Retro
    Pablo        Pablo      Stella           Max         Viktor       Rex    Quinn   Dex    Stella
```

### Returning User Flow (new feature on existing project)
```
Sprint N Planning → Dev Setup → Development → Review → QA → Deploy → Retro
      Stella           Max         Viktor       Rex    Quinn   Dex    Stella
```
Pablo is called back in only when the PRD needs updating (e.g. major pivot, new module). Stella handles the routing.

---

## 4. Core Workflow — Sprint Stages in Detail

### Stage 1 — Sprint Planning (Stella)
- Stella reads the current PRD + backlog from the repo
- Decomposes into sprint: goal, user stories, story points, acceptance criteria
- User approves or requests changes
- Output: `sprints/sprint-N.md` committed to repo

### Stage 2 — Dev Environment Setup (Max)
- Max creates the git worktree / feature branch for this sprint
- Reviews the sprint plan and identifies parallelisable components
- If parallelisable: prepares the parallel execution plan and briefs Viktor
- If linear: hands off to Viktor directly
- Output: clean isolated branch + execution plan

### Stage 3 — Development (Viktor + optionally Max)
- Viktor runs `subagent-driven-development`
- **Terminal panel** streams all tool use in real-time (file reads/writes, tests, git, bash)
- Strictly enforces TDD: tests written before implementation, always
- **Parallel mode:** when Max has identified independent tasks, Viktor executes up to 3 concurrent Claude API agents. UI shows multiple terminal panels side by side.
- Output: committed code on feature branch + test results

### Stage 4 — Code Review (Rex)
- Rex reviews the PR diff against PRD, sprint plan, code quality, test coverage
- Issues: 🔴 Critical / 🟡 Let's Improve This / 🟢 Minor Suggestion
- Viktor looped in for Critical fixes (with Max re-running if parallel work needed)
- Output: approved PR

### Stage 5 — QA (Quinn)
- Quinn runs full test suite, flags failures, coverage gaps, edge cases
- Coordinates with Viktor for fixes
- Output: QA sign-off report

### Stage 6 — Deploy (Dex)
- Dex triggers GitHub Actions pipeline
- Preview deploy → user approval → production
- Output: live production URL + deploy record

### Stage 7 — Retrospective (Stella)
- What shipped, what took longer, carry-forwards
- Backlog updated in repo
- Output: `sprints/sprint-N-retro.md` committed

---

## 5. Technical Architecture

### Platform: Railway-Only

One platform. No Vercel. Railway handles everything.

```
Railway Project: Scrumbs
  ├── Service: web            (Next.js app — npm run start)
  ├── Service: agent          (persistent Node.js streaming service)
  └── Service: postgres       (Postgres database — Railway managed)
```

No external services. Everything in one Railway project.

**Why Railway over Vercel:**
- Persistent Node.js servers — no serverless timeout for long AI agent runs
- One platform for web + agent service + database
- Simplest self-hosting: `railway up` from a clone
- No external auth service, no second billing account

---

### Monorepo Structure (Turborepo)

The web and agent services share database schema, TypeScript types, and persona definitions. To avoid duplication and a painful refactor in Plan 2, the repo is structured as a Turborepo monorepo from day one.

```
scrumbs/
├── apps/
│   ├── web/           # Next.js 16 app (Railway service: web)
│   └── agent/         # Express persistent server (Railway service: agent)
├── packages/
│   ├── db/            # Drizzle schema, migrations, db client (shared)
│   ├── types/         # Shared TypeScript types (Persona, Artifact, AgentTask, etc.)
│   └── personas/      # Persona modules + superpowers skill injection (shared)
├── turbo.json
└── package.json       # Root workspace (npm workspaces)
```

This means `apps/agent` can `import { db } from '@scrumbs/db'` and `import { viktor } from '@scrumbs/personas'` without any code duplication.

---

### Framework: Next.js 16 on Railway

**Decision rationale:**
- shadcn/ui: production-quality component library, fastest path to polished UI
- Vercel AI SDK (`ai` package): works perfectly on Railway, first-class streaming tool use
- Deep ecosystem for Claude API + streaming examples
- `railway up` runs `next start` — trivially deployable

---

### Auth: Auth.js v5 (NextAuth) + GitHub OAuth

Authentication is handled by Auth.js v5 with the Drizzle adapter, storing sessions in Railway Postgres. No external auth service.

**How it works:**
- User clicks "Continue with GitHub" → Auth.js handles the full OAuth flow
- GitHub access token stored in JWT session (accessible server-side via `auth()`)
- All DB access goes through Next.js API routes → Drizzle → Railway Postgres
- Data isolation enforced by service layer: every query filters by `userId`
- Row Level Security not used — service-layer checks are simpler and auditable

**Middleware is one line:**
```typescript
export { auth as middleware } from '@/auth'
```

**GitHub token scope:** `read:user repo` — needed for branch/commit/PR operations later.

---

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

If the browser disconnects, reconnecting with the same `taskId` resumes the stream from the agent's current position.

---

### The AI Streaming Architecture

```
Browser (Next.js)
  │
  ├── Short requests → apps/web API routes → packages/db → Postgres
  │
  └── Long AI tasks → apps/agent (Railway, no timeout)
                          │
                          ├── packages/db (shared schema)
                          ├── packages/personas (shared persona modules)
                          ├── Vercel AI SDK v6 ToolLoopAgent
                          │     ├── Manages tool execution loop, context window, stop conditions
                          │     ├── needsApproval gates → SSE → terminal panel (user confirms)
                          │     ├── tool_call events → SSE → terminal panel
                          │     ├── tool_output events → SSE → terminal panel
                          │     └── text events → SSE → message bubble
                          └── GitHub API (commits, PRs, branch ops)
```

**AI SDK v6 agent classes used in `apps/agent`:**
- `ToolLoopAgent` — for standard multi-step tool execution (Viktor, Rex, Quinn, Dex). Automatically manages the tool execution loop, context window truncation, and stop conditions.
- `DurableAgent` — evaluated for Max's parallel orchestration; persists state across network interruptions natively.

**Parallel agent execution (Max's mode):**
```javascript
const results = await Promise.all([
  runAgent(task1, streamToPanel(1)),
  runAgent(task2, streamToPanel(2)),
  runAgent(task3, streamToPanel(3)),
])
```

---

### Persona Architecture

```typescript
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
    bash,                              // read-only shell commands
    { ...writeFile,  needsApproval: true },  // pause before any file write
    { ...gitCommit,  needsApproval: true },  // pause before commit
    { ...gitPush,    needsApproval: true },  // pause before push
  ],
  maxConcurrent: 3,
}
```

**Human-in-the-loop pattern (AI SDK v6):** All tools flagged `needsApproval: true` pause the agent stream and surface the pending operation to the terminal panel UI for explicit user confirmation before execution. This uses the Vercel AI SDK v6 native approval mechanism — no custom polling needed.

---

### Tech Stack (All Decisions Final)

| Concern | Choice | Version | Rationale |
|---------|--------|---------|-----------|
| Platform | Railway | — | Persistent servers, one platform, self-host friendly |
| Repo structure | Turborepo monorepo | 2.8.x | Shared db/types/personas between web + agent |
| Framework | Next.js (App Router) | 16.x | shadcn/ui, Vercel AI SDK, ecosystem depth |
| Styling | Tailwind CSS v4 + shadcn/ui | 4.2.x | CSS-first `@theme` tokens, no config file |
| AI streaming | Vercel AI SDK | 6.x | First-class streaming tool use, works on Railway |
| AI provider | `@ai-sdk/anthropic` | 3.x | Paired with AI SDK v6 |
| Database | Railway Postgres (via Drizzle) | — | Same ecosystem, no extra service |
| ORM | Drizzle ORM + drizzle-kit | 0.45.x / 0.31.x | Lightweight, 2026 standard |
| Validation | Zod | 4.x | v4 rewrite — ~100x perf, smaller bundle |
| Auth | Auth.js v5 (NextAuth) + Drizzle adapter | 5.x | GitHub OAuth, 1 npm package, no SaaS |
| GitHub client | `@octokit/rest` | 22.x | ESM-only — use `import`, not `require` |
| AI engine | Anthropic Claude API | claude-sonnet-4-6 | Core engine |
| Transport | SSE (agent service → browser) | — | No timeout, reconnectable by taskId |
| CI/CD | GitHub Actions | — | Standard, Dex manages it |
| Runtime | Node.js | 20+ LTS | Current LTS |
| TypeScript | TypeScript | 5.9.x | Latest stable |
| Testing | Vitest | 4.x | v4 worker pooling improvements |

---

## 6. Project Scope: Greenfield Only (MVP)

**MVP supports greenfield projects only** — new repositories created specifically for the project. Linking an existing mature codebase is explicitly out of scope for MVP.

Rationale: Pablo's PRD authoring and Viktor's TDD implementation assume a blank slate. Ingesting and reasoning about an existing large codebase requires a separate "Repo Archaeology" mode (Pablo reads the repo, summarises architecture, reverse-engineers a PRD) which is a distinct product feature.

**Post-MVP:** A "Brownfield Mode" where Pablo ingests an existing repo and reverse-engineers a PRD from the codebase is a Phase 2 feature.

---

## 7. Data Model

```
Project
  id, userId
  name, description
  githubRepo        -- e.g. "alecburrett/my-app" (1:1 with repo)
  defaultBranch     -- e.g. "main"
  status            -- active | archived
  createdAt, updatedAt

  → has one: Requirements (project-level artifact)
  → has one: PRD         (project-level artifact)
  → has many: Sprints

Sprint
  id, projectId
  number            -- 1, 2, 3...
  goal              -- sprint goal statement
  status            -- planning | setup | development | review | qa | deploying | complete
  featureBranch     -- e.g. "sprint-3-user-auth"
  prUrl             -- GitHub PR URL once opened
  deployUrl         -- production deploy URL once live
  createdAt, completedAt

  → has many: Stories
  → has many: AgentTasks
  → has one: SprintPlan artifact
  → has one: RetroNotes artifact
  → has many: Conversations (one per stage per sprint)

Story
  id, sprintId
  title, description
  points            -- story point estimate
  status            -- todo | in_progress | done
  acceptanceCriteria

AgentTask                        -- tracks all long-running agent jobs
  id, projectId, sprintId
  stage             -- which workflow stage triggered this task
  persona           -- pablo | stella | viktor | rex | quinn | dex | max
  status            -- pending | running | completed | failed | cancelled
  input             -- JSON: task parameters sent to agent service
  output            -- JSON: final result from agent service
  error             -- error message if failed
  sessionId         -- used for SSE reconnection (browser uses this to resume stream)
  startedAt, completedAt, createdAt

Artifact
  id, projectId, sprintId (nullable — null if project-level)
  type              -- requirements | prd | sprint-plan | test-report | review | retro | deploy-url
  content           -- markdown text
  commitSha         -- GitHub commit SHA when committed
  createdAt, updatedAt

Conversation
  id, projectId, sprintId (nullable)
  stage             -- requirements | prd | planning | setup | development | review | qa | deploy | retro
  persona           -- pablo | stella | viktor | rex | quinn | dex | max
  messages          -- { role, content, timestamp, toolCalls? }[]
  createdAt

```

---

## 7. Open Source & Self-Hosting

| Component | Cloud | Self-hosted |
|-----------|-------|-------------|
| Web app | Railway | Docker or any Node.js host |
| Agent service | Railway | Docker or any persistent Node.js host |
| Database | Railway Postgres | Any Postgres (Docker, Neon, etc.) |
| Auth | Auth.js v5 (runs in-process) | Same — it's just an npm package |
| CI/CD | GitHub Actions | GitHub Actions (free for open source) |

**Required env vars:**
```env
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
AGENT_SERVICE_SECRET=  # Shared secret for web→agent auth
```

---

## 8. UI/UX

### Layout
- **Left sidebar:** Project list, new project CTA
- **Main area:** Stage workspace — conversation (left 60%) + artifact panel (right 40%)
- **Top bar:** Sprint progress indicator (7 stages), current stage highlighted
- **Terminal panel:** Slides up from bottom during Max/Viktor stages, collapsible to status bar

### Stage Navigation
- Completed: clickable, read-only review
- Current: active workspace
- Future: locked with descriptive tooltip
- "Step back": always available, requires confirmation

### Handoff Moment (the ceremony)
1. Outgoing persona: "Handing off to Max — the sprint plan is locked."
2. Animated card with incoming persona's avatar + colour accent
3. Incoming persona's intro line in their voice
4. Incoming persona's conversation starts streaming immediately

### Persona Colour System
| Persona | Colour | Hex |
|---------|--------|-----|
| Pablo | Warm amber | `#F59E0B` |
| Stella | Sage green | `#6B9E6B` |
| Viktor | Cool blue | `#3B82F6` |
| Rex | Deep purple | `#7C3AED` |
| Quinn | Coral | `#F97316` |
| Dex | Electric teal | `#06B6D4` |
| Max | Warm slate | `#64748B` |
| Coach | Gold | `#EAB308` |

### Terminal Panel (Viktor / Max stages)
- Dark background, monospace font (JetBrains Mono or similar)
- Event-type styling:
  - `▶ tool_call`: accent colour prefix, tool name
  - Tool input params: dim, streaming in
  - `tool_output`: white, standard terminal
  - File write: green with filename
  - Test pass/fail: green ✓ / red ✗ with test name
  - Git op: blue accent
  - Error: red with context
- **Parallel mode:** terminal splits into 2–3 columns, each panel headed with a task label

### Sprint Board
- Kanban strip above terminal: **To Do** → **In Progress** → **Done**
- Story cards move in real time as Viktor works through them
- Story point totals visible, satisfying Done animation
- Visible throughout the Development and QA stages

### Scrum Language Throughout
- "Sprint 3 of Project X"
- "Velocity: 21 points"
- Stage names: Sprint Planning, Development, Sprint Review, Retrospective
- Stella announces ceremonies: "Let's kick off Sprint Planning!"

---

## 9. MVP Scope

### In Scope
- GitHub OAuth via Auth.js v5
- Create projects linked to a GitHub repo (1:1)
- Full sprint workflow (7 stages) for new and returning projects
- Project-level Requirements + PRD flow (Pablo) for new projects
- All 7 core personas, in-character, with correct underlying skills
- Real-time SSE streaming at every stage (Vercel AI SDK)
- Terminal panel with tool use streaming (Viktor + Max stages)
- Parallel agent execution (Max, up to 3 concurrent)
- GitHub integration: branches, commits, PRs, Actions status
- Artifact storage: Railway Postgres (via Drizzle) + committed to repo
- Handoff animations between personas
- Sprint board during Development + QA stages
- Multi-sprint projects (Sprint 1 → Sprint 2 → ...)
- Mobile-responsive layout

### Out of Scope (Post-MVP)
- Coach persona + custom skill creation
- Multi-user / team collaboration
- Billing + subscription tiers
- Full Claude Code CLI subprocess
- MCP server support in terminal
- Slack / Jira / Linear integrations
- Per-project GitHub Actions template selection
- Analytics / velocity tracking dashboard

---

## 10. SaaS Evolution

### Phase 2 — Multi-Sprint & Polish
- Sprint history view, velocity charts
- Backlog management between sprints
- Pablo available mid-sprint for PRD updates

### Phase 3 — Collaboration
- Team workspaces, shared projects
- Multiple human users on one project

### Phase 4 — Billing
- Free: 1 active project
- Pro: unlimited projects + Coach persona
- Team: collaboration + shared billing

### Phase 5 — Platform
- Coach unlocked on Pro (custom personas, skill creation)
- MCP server support in terminal
- Plugin system for new workflow stages
- Enterprise self-hosted option with support

---

## 11. Resolved Decisions

1. **GitHub Actions template:** Option B — Dex asks during Deploy stage: Railway or Vercel (with custom as escape hatch). Generates the appropriate workflow file. ✅

2. **Artifact editing:** Read-only in-app with "Edit in GitHub" link for MVP. In-app rich text editing post-MVP. ✅

3. **Claude model per persona:** All on `claude-sonnet-4-6` for MVP. Rex + Viktor optionally on `claude-opus-4-6` post-MVP. ✅

4. **Agent service multi-tenancy:** Single shared Railway agent service for MVP, sessions isolated by `sessionId`. Per-workspace containers for Team tier post-MVP. ✅

---

**PRD Status: COMPLETE — Ready for implementation planning.**

*End of PRD v0.7*
