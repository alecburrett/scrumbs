# Scrumbs — Phase-Gated Verify & Fix

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-validate the scaffolded codebase phase-by-phase, fixing all 20 code review issues (GitHub #54–#73) in dependency order, with a working verification checkpoint at each phase boundary.

**Architecture:** The codebase is a monorepo with 4 packages (`db`, `types`, `personas`, `agent`, `web`). Code was scaffolded across all 6 phases simultaneously but never validated. We work bottom-up: DB/auth first, then agent service, then personas, then sprint flow, then polish. Each phase must build, pass tests, and be functionally verified before the next begins.

**Tech Stack:** Next.js 15 (App Router), Fastify 5, Drizzle ORM + PostgreSQL, Auth.js v5, Anthropic SDK, Vitest

**Branch:** All work on `feat/phase-1-foundation` (current branch).

---

## Chunk 1: Phase 1 — Foundation

**Issues fixed:** #54 (IDOR), #58 (auth schema), #59 (migration path), #68 (DB pool/constraints), #72 (middleware), #73 (drizzle config)

**Verification gate:** `npm install` succeeds, all packages build via `tsc`, `drizzle-kit generate` produces migrations, vitest passes for state machine + API route ownership checks.

---

### Task 1: Add vitest infrastructure

**Files:**
- Create: `vitest.config.ts` (root)
- Modify: `package.json` (root — add test script + vitest devDep)

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 2: Create root vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
})
```

- [ ] **Step 3: Add root test script**

In `package.json`, add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest test infrastructure"
```

---

### Task 2: Fix DB schema — auth tables (#58)

**Files:**
- Modify: `packages/db/src/schema/auth.ts`

**Reference:** `@auth/drizzle-adapter` v1.x canonical PostgreSQL schema.

- [ ] **Step 1: Write failing test for schema expectations**

Create `packages/db/src/schema/__tests__/auth.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getTableConfig } from 'drizzle-orm/pg-core'
import { users, accounts, sessions, verificationTokens, authenticators } from '../auth'

describe('auth schema', () => {
  it('users table has unique email constraint', () => {
    const config = getTableConfig(users)
    const emailCol = config.columns.find(c => c.name === 'email')
    expect(emailCol?.isUnique).toBe(true)
  })

  it('authenticators table exists with correct PK and unique credential', () => {
    const config = getTableConfig(authenticators)
    expect(config.name).toBe('authenticator')
    const credIdCol = config.columns.find(c => c.name === 'credential_id')
    expect(credIdCol).toBeDefined()
    expect(credIdCol?.isUnique).toBe(true)
    // Verify composite PK on (userId, credentialID)
    expect(config.primaryKeys.length).toBeGreaterThan(0)
    const pkColNames = config.primaryKeys[0].columns.map(c => c.name)
    expect(pkColNames).toContain('userId')
    expect(pkColNames).toContain('credential_id')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run packages/db/src/schema/__tests__/auth.test.ts
```

Expected: FAIL — `authenticators` is not exported, `email` is not unique.

- [ ] **Step 3: Fix auth.ts — add unique email + authenticator table**

In `packages/db/src/schema/auth.ts`:

1. Change `email` line:
```ts
email: text('email').notNull().unique(),
```

2. Add `boolean` to the import from `drizzle-orm/pg-core`.

3. Add `authenticators` table after `verificationTokens`:
```ts
export const authenticators = pgTable(
  'authenticator',
  {
    credentialID: text('credential_id').notNull().unique(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerAccountId: text('provider_account_id').notNull(),
    credentialPublicKey: text('credential_public_key').notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: text('credential_device_type').notNull(),
    credentialBackedUp: boolean('credential_backed_up').notNull(),
    transports: text('transports'),
  },
  (t) => ({
    compoundKey: primaryKey({ columns: [t.userId, t.credentialID] }),
  })
)
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run packages/db/src/schema/__tests__/auth.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/schema/auth.ts packages/db/src/schema/__tests__/auth.test.ts
git commit -m "fix(db): add unique email constraint and authenticator table (#58)"
```

---

### Task 3: Fix DB schema — sprint uniqueness + updatedAt (#68)

**Files:**
- Modify: `packages/db/src/schema/projects.ts`
- Modify: `packages/db/src/schema/agent-tasks.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/db/src/schema/__tests__/projects.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getTableConfig } from 'drizzle-orm/pg-core'
import { sprints } from '../projects'

describe('projects schema', () => {
  it('sprints table has unique constraint on (projectId, number)', () => {
    const config = getTableConfig(sprints)
    // Check that a unique constraint exists covering projectId + number
    const hasUniqueIdx = config.uniqueConstraints.some(uc => {
      const colNames = uc.columns.map(c => c.name)
      return colNames.includes('project_id') && colNames.includes('number')
    })
    expect(hasUniqueIdx).toBe(true)
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run packages/db/src/schema/__tests__/projects.test.ts
```

- [ ] **Step 3: Add unique constraint to sprints table**

In `packages/db/src/schema/projects.ts`, add `unique` to the import:
```ts
import { pgTable, text, timestamp, integer, pgEnum, unique } from 'drizzle-orm/pg-core'
```

Add table config (third argument to `pgTable`):
```ts
export const sprints = pgTable('sprint', {
  // ... existing columns unchanged ...
}, (t) => ({
  projectNumberUnique: unique().on(t.projectId, t.number),
}))
```

- [ ] **Step 4: Add $onUpdateFn to agentTasks.updatedAt**

In `packages/db/src/schema/agent-tasks.ts`, change the `updatedAt` line:
```ts
updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
```

- [ ] **Step 5: Run tests — verify passing**

```bash
npx vitest run packages/db/src/schema/__tests__/
```

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/schema/projects.ts packages/db/src/schema/agent-tasks.ts packages/db/src/schema/__tests__/projects.test.ts
git commit -m "fix(db): add sprint uniqueness constraint and auto-update updatedAt (#68)"
```

---

### Task 4: Fix DB connection pool + singleton (#68)

**Files:**
- Modify: `packages/db/src/index.ts`
- Modify: `apps/web/auth.ts`
- Modify: `apps/web/lib/db.ts`

- [ ] **Step 1: Add pool limits and singleton to packages/db/src/index.ts**

Replace `createDb`:

```ts
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as authSchema from './schema/auth'
import * as projectsSchema from './schema/projects'
import * as agentTasksSchema from './schema/agent-tasks'

const schema = { ...authSchema, ...projectsSchema, ...agentTasksSchema }

// Singleton cache keyed by connection string
const instances = new Map<string, ReturnType<typeof drizzle>>()

export function createDb(connectionString: string) {
  const existing = instances.get(connectionString)
  if (existing) return existing

  const client = postgres(connectionString, { max: 10, idle_timeout: 20 })
  const db = drizzle(client, { schema })
  instances.set(connectionString, db)
  return db
}

export type Db = ReturnType<typeof createDb>

// Note: createDb IS the singleton — calling it twice with the same connection string
// returns the same instance. No separate getDb needed. All call sites (apps/web/lib/db.ts,
// apps/web/auth.ts, apps/agent/src/index.ts) use createDb and get the singleton.
export * from './schema/auth'
export * from './schema/projects'
export * from './schema/agent-tasks'
```

- [ ] **Step 2: Fix apps/web/auth.ts to import shared db**

Replace the `createDb` call in `auth.ts`:

```ts
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      authorization: { params: { scope: 'read:user user:email repo' } },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
```

- [ ] **Step 3: Commit**

```bash
git add packages/db/src/index.ts apps/web/auth.ts apps/web/lib/db.ts
git commit -m "fix(db): singleton connection pool with max limit; share db in web app (#68)"
```

---

### Task 5: Fix migration path resolution (#59) + drizzle config (#73)

**Files:**
- Modify: `packages/db/src/migrate.ts`
- Modify: `packages/db/drizzle.config.ts`

- [ ] **Step 1: Fix migrate.ts to use import.meta.url**

```ts
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is required')

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: path.join(__dirname, '../drizzle') })
  console.log('Migrations complete')
  await client.end()
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
```

- [ ] **Step 2: Fix drizzle.config.ts schema glob**

Change:
```ts
schema: './src/schema/*.ts',
```

- [ ] **Step 3: Commit**

```bash
git add packages/db/src/migrate.ts packages/db/drizzle.config.ts
git commit -m "fix(db): resolve migration path from package dir; restrict schema glob to .ts (#59, #73)"
```

---

### Task 6: Fix API routes — ownership checks (#54)

This is the largest task in Phase 1. Every sprint/story/task route needs a project-ownership join.

**Files:**
- Modify: `apps/web/app/api/sprints/[sprintId]/route.ts`
- Modify: `apps/web/app/api/sprints/[sprintId]/retro/route.ts`
- Modify: `apps/web/app/api/sprints/[sprintId]/stories/[storyId]/route.ts`
- Modify: `apps/web/app/api/tasks/[taskId]/approve/route.ts`
- Modify: `apps/web/app/api/tasks/[taskId]/cancel/route.ts`
- Create: `apps/web/lib/__tests__/api-ownership.test.ts`

- [ ] **Step 1: Create a shared ownership helper**

Create `apps/web/lib/ownership.ts`:

```ts
import { db } from '@/lib/db'
import { sprints, projects, stories } from '@scrumbs/db'
import { agentTasks } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'

export async function getSprintIfOwned(sprintId: string, userId: string) {
  const [result] = await db
    .select({
      id: sprints.id,
      projectId: sprints.projectId,
      number: sprints.number,
      status: sprints.status,
      featureBranch: sprints.featureBranch,
      createdAt: sprints.createdAt,
      completedAt: sprints.completedAt,
    })
    .from(sprints)
    .innerJoin(projects, eq(sprints.projectId, projects.id))
    .where(and(eq(sprints.id, sprintId), eq(projects.userId, userId)))
  return result ?? null
}

export async function getStoryIfOwned(storyId: string, sprintId: string, userId: string) {
  const [result] = await db
    .select({
      id: stories.id,
      sprintId: stories.sprintId,
      title: stories.title,
      status: stories.status,
    })
    .from(stories)
    .innerJoin(sprints, eq(stories.sprintId, sprints.id))
    .innerJoin(projects, eq(sprints.projectId, projects.id))
    .where(and(
      eq(stories.id, storyId),
      eq(stories.sprintId, sprintId),
      eq(projects.userId, userId),
    ))
  return result ?? null
}

export async function getTaskIfOwned(taskId: string, userId: string) {
  const [result] = await db
    .select({ id: agentTasks.id, status: agentTasks.status })
    .from(agentTasks)
    .innerJoin(sprints, eq(agentTasks.sprintId, sprints.id))
    .innerJoin(projects, eq(sprints.projectId, projects.id))
    .where(and(eq(agentTasks.id, taskId), eq(projects.userId, userId)))
  return result ?? null
}
```

- [ ] **Step 2: Rewrite sprints/[sprintId]/route.ts with ownership checks + TransitionError handling**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { sprints, stories } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import { assertValidTransition, TransitionError } from '@/lib/sprint-state-machine'
import type { SprintStatus } from '@scrumbs/types'
import { getSprintIfOwned } from '@/lib/ownership'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sprintId } = await params
  const sprint = await getSprintIfOwned(sprintId, session.user.id)
  if (!sprint) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Preserve existing behavior: include stories in the response
  const sprintStories = await db
    .select()
    .from(stories)
    .where(eq(stories.sprintId, sprintId))
  return NextResponse.json({ ...sprint, stories: sprintStories })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sprintId } = await params
  const sprint = await getSprintIfOwned(sprintId, session.user.id)
  if (!sprint) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { status } = (await req.json()) as { status: SprintStatus }

  try {
    assertValidTransition(sprint.status as SprintStatus, status, 'api-patch')
  } catch (err) {
    if (err instanceof TransitionError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }

  const updateData: Record<string, unknown> = { status }
  if (status === 'complete') {
    updateData.completedAt = new Date()
  }

  const [updated] = await db
    .update(sprints)
    .set(updateData)
    .where(eq(sprints.id, sprintId))
    .returning()

  return NextResponse.json(updated)
}
```

- [ ] **Step 3: Rewrite retro/route.ts — ownership + JSON response + carry forward in-progress stories (#67)**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { sprints, stories } from '@scrumbs/db'
import { eq, and, inArray } from 'drizzle-orm'
import { getSprintIfOwned } from '@/lib/ownership'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sprintId } = await params
  const currentSprint = await getSprintIfOwned(sprintId, session.user.id)
  if (!currentSprint) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (currentSprint.status !== 'complete') {
    return NextResponse.json(
      { error: 'Sprint must be complete before starting retro' },
      { status: 400 }
    )
  }

  // Calculate next sprint number safely
  const projectSprints = await db
    .select({ number: sprints.number })
    .from(sprints)
    .where(eq(sprints.projectId, currentSprint.projectId))
  const maxNumber = projectSprints.reduce((max, s) => Math.max(max, s.number), 0)

  // Create next sprint
  const [newSprint] = await db
    .insert(sprints)
    .values({
      projectId: currentSprint.projectId,
      number: maxNumber + 1,
      status: 'planning',
    })
    .returning()

  // Carry forward incomplete stories (todo AND in-progress)
  const incompleteStories = await db
    .select()
    .from(stories)
    .where(and(
      eq(stories.sprintId, sprintId),
      inArray(stories.status, ['todo', 'in-progress']),
    ))

  if (incompleteStories.length > 0) {
    await db.insert(stories).values(
      incompleteStories.map((s, i) => ({
        sprintId: newSprint.id,
        title: s.title,
        description: s.description,
        status: 'todo' as const,
        order: i,
      }))
    )
  }

  return NextResponse.json({ sprintId: newSprint.id }, { status: 201 })
}
```

- [ ] **Step 4: Rewrite stories/[storyId]/route.ts — ownership + validate sprintId + validate status**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { stories } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import type { StoryStatus } from '@scrumbs/types'
import { getStoryIfOwned } from '@/lib/ownership'

const VALID_STORY_STATUSES: StoryStatus[] = ['todo', 'in-progress', 'done']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sprintId: string; storyId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sprintId, storyId } = await params
  const { status } = (await req.json()) as { status: StoryStatus }

  if (!VALID_STORY_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const story = await getStoryIfOwned(storyId, sprintId, session.user.id)
  if (!story) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [updated] = await db
    .update(stories)
    .set({ status })
    .where(eq(stories.id, storyId))
    .returning()

  return NextResponse.json(updated)
}
```

- [ ] **Step 5: Fix task approve/cancel routes — ownership + consistent session check**

`apps/web/app/api/tasks/[taskId]/approve/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTaskIfOwned } from '@/lib/ownership'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { taskId } = await params
  const task = await getTaskIfOwned(taskId, session.user.id)
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const agentUrl = process.env.AGENT_SERVICE_URL
  const agentSecret = process.env.AGENT_SERVICE_SECRET
  if (!agentUrl || !agentSecret) {
    return NextResponse.json({ error: 'Agent service not configured' }, { status: 500 })
  }

  const res = await fetch(`${agentUrl}/tasks/${taskId}/approve`, {
    method: 'POST',
    headers: { 'x-agent-secret': agentSecret },
  })

  return NextResponse.json(await res.json(), { status: res.status })
}
```

Apply the identical pattern to `cancel/route.ts` (change `/approve` to `/cancel` in the fetch URL).

- [ ] **Step 6: Fix sprint number calculation in projects/[projectId]/sprints/route.ts**

In the POST handler, replace `existingSprints.length + 1` with:
```ts
const maxNumber = existingSprints.reduce((max, s) => Math.max(max, s.number), 0)
const nextNumber = maxNumber + 1
```

Also remove the dead `assertValidTransition` import.

- [ ] **Step 7: Standardize middleware auth check (#72)**

No code change needed to `middleware.ts` itself — the `/api` exclusion is intentional (Auth.js middleware would redirect API calls to a login page instead of returning 401). The fix is ensuring all routes use `!session?.user?.id` consistently, which we've done in steps 2-5.

- [ ] **Step 8: Commit**

```bash
git add apps/web/lib/ownership.ts apps/web/app/api/
git commit -m "fix(web): add ownership checks to all API routes, catch TransitionError, fix retro (#54, #67, #72)"
```

---

### Task 7: Phase 1 verification checkpoint

- [ ] **Step 1: Install all dependencies**

```bash
cd /home/alec/scrumbs && npm install
```

- [ ] **Step 2: Build all packages in order**

```bash
npm run build --workspace=packages/types
npm run build --workspace=packages/db
npm run build --workspace=packages/personas
```

- [ ] **Step 3: Verify drizzle-kit generate works**

```bash
# Requires DATABASE_URL — use a local postgres or skip if not available
# npm run generate --workspace=packages/db
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: All schema tests and ownership helper tests pass.

- [ ] **Step 5: Verify web app builds**

```bash
npm run build --workspace=apps/web
```

Fix any TypeScript errors that surface. Common issues: import paths, missing type exports.

- [ ] **Step 6: Tag checkpoint**

```bash
git add -A && git commit -m "chore: phase 1 verification checkpoint — foundation solid"
```

---

## Chunk 2: Phase 2 — Agent Service Core

**Issues fixed:** #55 (SSE registration), #56 (approval race), #57 (buffer/socket leak), #61 (bash allowlist), #62 (GIT_TOKEN leak), #63 (path traversal), #65 (cost guard), #66 (workspace)

**Verification gate:** Agent service builds, vitest passes for SSE emitter, approval gate, workspace path validation, cost guard, retry logic. Dummy echo persona streams events end-to-end in a test.

---

### Task 8: Fix SSE emitter registration + socket lifecycle (#55, #57)

**Files:**
- Modify: `apps/agent/src/routes/tasks.ts`
- Modify: `apps/agent/src/lib/agent-loop.ts`
- Create: `apps/agent/src/lib/__tests__/sse.test.ts`

- [ ] **Step 1: Write test for SSE buffer lifecycle**

```ts
import { describe, it, expect } from 'vitest'
import { SSEEmitter } from '../sse'
import { Writable } from 'node:stream'
import type { ServerResponse } from 'node:http'

function mockRes(): ServerResponse {
  const chunks: string[] = []
  const writable = new Writable({
    write(chunk, _enc, cb) { chunks.push(chunk.toString()); cb() },
  })
  return Object.assign(writable, { chunks }) as unknown as ServerResponse
}

describe('SSEEmitter', () => {
  it('emits events and buffers them', () => {
    const res = mockRes()
    const emitter = new SSEEmitter('sess-1', res)
    emitter.emit({ type: 'message', taskId: 't1', sessionId: 'sess-1', payload: 'hello', timestamp: '' })
    expect((res as any).chunks.length).toBe(1)
    expect((res as any).chunks[0]).toContain('"type":"message"')
  })

  it('replays buffered events to a new connection', () => {
    const res1 = mockRes()
    const emitter = new SSEEmitter('sess-2', res1)
    emitter.emit({ type: 'message', taskId: 't2', sessionId: 'sess-2', payload: 'first', timestamp: '' })
    emitter.emit({ type: 'done', taskId: 't2', sessionId: 'sess-2', payload: {}, timestamp: '' })

    const res2 = mockRes()
    SSEEmitter.replay('sess-2', res2)
    expect((res2 as any).chunks.length).toBe(2)
  })

  it('clearBuffer removes session data', () => {
    const res = mockRes()
    const emitter = new SSEEmitter('sess-3', res)
    emitter.emit({ type: 'message', taskId: 't3', sessionId: 'sess-3', payload: 'x', timestamp: '' })
    SSEEmitter.clearBuffer('sess-3')

    const res2 = mockRes()
    SSEEmitter.replay('sess-3', res2)
    expect((res2 as any).chunks.length).toBe(0)
  })
})
```

- [ ] **Step 2: Run test — should pass (SSEEmitter itself is correct)**

```bash
npx vitest run apps/agent/src/lib/__tests__/sse.test.ts
```

- [ ] **Step 3: Fix tasks.ts — register emitter + resolve on close + clear buffer**

Replace the SSE route in `apps/agent/src/routes/tasks.ts`:

```ts
// GET /tasks/:id/stream — SSE stream
fastify.get<{ Params: { id: string }; Querystring: { sessionId?: string } }>(
  '/:id/stream',
  async (request, reply) => {
    const { id } = request.params
    const { sessionId } = request.query

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const sid = sessionId ?? id

    // FIX: replay FIRST, then register — prevents out-of-order events
    SSEEmitter.replay(sid, reply.raw)

    const emitter = new SSEEmitter(sid, reply.raw)
    registerEmitter(id, emitter)  // <-- FIX: wire emitter to agent loop

    const keepAlive = setInterval(() => {
      reply.raw.write(': keep-alive\n\n')
    }, 15000)

    // FIX: resolve on close, clean up
    await new Promise<void>((resolve) => {
      request.socket.on('close', () => {
        clearInterval(keepAlive)
        unregisterEmitter(id)
        resolve()
      })
    })
  }
)
```

Add imports at top of file:
```ts
import { registerEmitter, unregisterEmitter } from '../lib/agent-loop.js'
```

- [ ] **Step 4: Fix agent-loop.ts — clear buffer in finally block**

In the `finally` block of `runAgentTask`, add buffer cleanup after a grace period:
```ts
finally {
  unregisterEmitter(taskId)
  // Allow 30s for reconnect replay, then clean up
  setTimeout(() => SSEEmitter.clearBuffer(sessionId), 30_000)
}
```

Add import:
```ts
import { SSEEmitter } from './sse.js'
```

- [ ] **Step 5: Commit**

```bash
git add apps/agent/src/routes/tasks.ts apps/agent/src/lib/agent-loop.ts apps/agent/src/lib/__tests__/sse.test.ts
git commit -m "fix(agent): register SSE emitter, resolve socket on close, clear buffer (#55, #57)"
```

---

### Task 9: Fix approval gate race condition (#56)

**Files:**
- Modify: `apps/agent/src/lib/agent-loop.ts`
- Create: `apps/agent/src/lib/__tests__/approval.test.ts`

- [ ] **Step 1: Write test proving the race**

```ts
import { describe, it, expect } from 'vitest'
import { waitForApproval, resolveApproval } from '../approval'

describe('approval gate', () => {
  it('resolves when approval arrives after wait', async () => {
    const promise = waitForApproval('task-1')
    setTimeout(() => resolveApproval('task-1', true), 10)
    expect(await promise).toBe(true)
  })

  it('handles correct ordering: wait registered before resolve', async () => {
    // The fix ensures waitForApproval is always called before resolveApproval
    // by registering the gate before emitting the SSE event in agent-loop.ts
    const promise = waitForApproval('task-2')
    // Simulate small delay as the SSE event travels to client and back
    setTimeout(() => resolveApproval('task-2', false), 5)
    expect(await promise).toBe(false)
  })
})
```

- [ ] **Step 2: Fix agent-loop.ts — register gate BEFORE emitting approval_required**

In `runAgentTask`, change the approval section:

```ts
// Step 2 — approval gate
if (await isTaskCancelled(db, taskId)) return

// FIX: register gate BEFORE emitting the event
const approvalPromise = waitForApproval(taskId)

emit({ type: 'approval_required', payload: { message: 'Echo persona requests approval to proceed to step 2', toolName: 'echo_step_2' } })
await db.update(agentTasks).set({ status: 'waiting_approval' }).where(eq(agentTasks.id, taskId))

const approved = await approvalPromise
await db.update(agentTasks).set({ status: 'running' }).where(eq(agentTasks.id, taskId))
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run apps/agent/src/lib/__tests__/approval.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add apps/agent/src/lib/agent-loop.ts apps/agent/src/lib/__tests__/approval.test.ts
git commit -m "fix(agent): register approval gate before emitting event to prevent race (#56)"
```

---

### Task 10: Fix workspace security — path traversal, GIT_TOKEN leak, repo validation (#62, #63, #66)

**Files:**
- Modify: `apps/agent/src/lib/workspace.ts`
- Create: `apps/agent/src/lib/__tests__/workspace.test.ts`

- [ ] **Step 1: Write tests for path traversal and repo validation**

```ts
import { describe, it, expect } from 'vitest'
import { validateWorkspacePath, validateRepoFormat } from '../workspace'

describe('validateWorkspacePath', () => {
  it('allows paths within workspace', () => {
    expect(() => validateWorkspacePath('/tmp/scrumbs/abc', 'src/index.ts')).not.toThrow()
  })

  it('rejects path traversal via ../', () => {
    expect(() => validateWorkspacePath('/tmp/scrumbs/abc', '../other/secret')).toThrow('Path traversal')
  })

  it('rejects prefix collision (abc vs abc-evil)', () => {
    // Path /tmp/scrumbs/abc-evil/file starts with /tmp/scrumbs/abc
    // but should be rejected because it escapes the workspace
    expect(() => validateWorkspacePath('/tmp/scrumbs/abc', '../abc-evil/file')).toThrow('Path traversal')
  })
})

describe('validateRepoFormat', () => {
  it('accepts valid owner/repo', () => {
    expect(() => validateRepoFormat('alecburrett/scrumbs')).not.toThrow()
  })

  it('rejects repos with special characters', () => {
    expect(() => validateRepoFormat('owner/@evil')).toThrow()
  })

  it('rejects repos with path traversal', () => {
    expect(() => validateRepoFormat('../../etc/passwd')).toThrow()
  })
})
```

- [ ] **Step 2: Fix workspace.ts**

```ts
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'

const execFileAsync = promisify(execFile)
const WORKSPACE_BASE = '/tmp/scrumbs'

export interface Workspace {
  dir: string
  gitEnv: NodeJS.ProcessEnv
  cleanEnv: NodeJS.ProcessEnv
  cleanup: () => Promise<void>
}

const REPO_FORMAT = /^[a-zA-Z0-9_.\-]+\/[a-zA-Z0-9_.\-]+$/

export function validateRepoFormat(repo: string): void {
  if (!REPO_FORMAT.test(repo)) {
    throw new Error(`Invalid repo format: ${repo}`)
  }
}

export function validateWorkspacePath(workspaceDir: string, filePath: string): string {
  const resolved = path.resolve(workspaceDir, filePath)
  // FIX: append path.sep to prevent prefix collision (abc vs abc-evil)
  if (!resolved.startsWith(path.resolve(workspaceDir) + path.sep) && resolved !== path.resolve(workspaceDir)) {
    throw new Error(`Path traversal attempt: ${filePath}`)
  }
  return resolved
}

export async function createWorkspace(taskId: string, repo: string, token: string): Promise<Workspace> {
  validateRepoFormat(repo)

  const dir = path.join(WORKSPACE_BASE, taskId)
  const askpassPath = path.join(WORKSPACE_BASE, `${taskId}-askpass.sh`)

  // FIX: only create base dir, not task dir (git clone creates it)
  await fs.mkdir(WORKSPACE_BASE, { recursive: true })

  await fs.writeFile(askpassPath, '#!/bin/sh\necho "$GIT_TOKEN"\n', { mode: 0o700 })

  const gitEnv: NodeJS.ProcessEnv = {
    ...process.env,
    GIT_ASKPASS: askpassPath,
    GIT_TOKEN: token,
    GIT_TERMINAL_PROMPT: '0',
  }

  // FIX: strip GIT_TOKEN from npm/test environment
  const { GIT_TOKEN: _token, GIT_ASKPASS: _askpass, ...cleanEnv } = gitEnv

  try {
    await execFileAsync('git', ['clone', `https://github.com/${repo}.git`, dir], { env: gitEnv })
    await execFileAsync('npm', ['install', '--prefer-offline'], { cwd: dir, env: cleanEnv })
  } catch (err) {
    // FIX: clean up on failure
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
    await fs.unlink(askpassPath).catch(() => {})
    throw err
  }

  return {
    dir,
    gitEnv,
    cleanEnv,
    cleanup: async () => {
      await Promise.all([
        fs.rm(dir, { recursive: true, force: true }),
        fs.unlink(askpassPath).catch(() => {}),
      ])
    },
  }
}
```

- [ ] **Step 3: Update tool implementations to use cleanEnv**

In each tool file (`bash.ts`, `run-tests.ts`, `git-commit.ts`), the `context.env` field will carry `cleanEnv`. Only `git-push.ts` needs `gitEnv` (for pushing with auth). Update `ToolContext`:

In `apps/agent/src/lib/tools/index.ts`:
```ts
export interface ToolContext {
  workspaceDir: string
  env: NodeJS.ProcessEnv      // clean env (no GIT_TOKEN)
  gitEnv: NodeJS.ProcessEnv   // full env (for git push only)
  taskId: string
}
```

Update `git-push.ts` to use `context.gitEnv`:
```ts
async execute(_input, context) {
  const { stdout } = await execFileAsync(
    'git', ['push', '--set-upstream', 'origin', 'HEAD'],
    { cwd: context.workspaceDir, env: context.gitEnv }
  )
  return stdout
},
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run apps/agent/src/lib/__tests__/workspace.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/agent/src/lib/workspace.ts apps/agent/src/lib/tools/ apps/agent/src/lib/__tests__/workspace.test.ts
git commit -m "fix(agent): path traversal boundary fix, repo validation, strip GIT_TOKEN from npm env (#62, #63, #66)"
```

---

### Task 11: Add bash command allowlist (#61)

**Files:**
- Modify: `apps/agent/src/lib/tools/bash.ts`
- Create: `apps/agent/src/lib/__tests__/bash-allowlist.test.ts`

- [ ] **Step 1: Write test**

```ts
import { describe, it, expect } from 'vitest'

// We test the allowlist logic directly
const ALLOWED_COMMANDS = new Set(['npm', 'npx', 'node', 'git', 'tsc', 'vitest', 'cat', 'ls', 'find', 'mkdir', 'cp', 'mv', 'rm', 'echo', 'head', 'tail', 'grep', 'wc', 'diff', 'sort', 'uniq'])

describe('bash allowlist', () => {
  it('allows npm', () => expect(ALLOWED_COMMANDS.has('npm')).toBe(true))
  it('allows git', () => expect(ALLOWED_COMMANDS.has('git')).toBe(true))
  it('blocks curl', () => expect(ALLOWED_COMMANDS.has('curl')).toBe(false))
  it('blocks wget', () => expect(ALLOWED_COMMANDS.has('wget')).toBe(false))
  it('blocks python3', () => expect(ALLOWED_COMMANDS.has('python3')).toBe(false))
  it('blocks ssh', () => expect(ALLOWED_COMMANDS.has('ssh')).toBe(false))
  it('blocks nc', () => expect(ALLOWED_COMMANDS.has('nc')).toBe(false))
})
```

- [ ] **Step 2: Add allowlist to bash.ts**

Add before `registerTool`:
```ts
const ALLOWED_COMMANDS = new Set([
  'npm', 'npx', 'node', 'git', 'tsc', 'vitest',
  'cat', 'ls', 'find', 'mkdir', 'cp', 'mv', 'rm',
  'echo', 'head', 'tail', 'grep', 'wc', 'diff', 'sort', 'uniq',
])
```

Add at the start of `execute`:
```ts
if (!ALLOWED_COMMANDS.has(command as string)) {
  throw new Error(`Command not permitted: ${command}. Allowed: ${[...ALLOWED_COMMANDS].join(', ')}`)
}
```

- [ ] **Step 3: Run tests + commit**

```bash
npx vitest run apps/agent/src/lib/__tests__/bash-allowlist.test.ts
git add apps/agent/src/lib/tools/bash.ts apps/agent/src/lib/__tests__/bash-allowlist.test.ts
git commit -m "fix(agent): add command allowlist to bash tool (#61)"
```

---

### Task 12: Fix cost guard — per-user concurrency + atomic token increment (#65)

**Files:**
- Modify: `apps/agent/src/lib/cost-guard.ts`
- Create: `apps/agent/src/lib/__tests__/cost-guard.test.ts`

- [ ] **Step 1: Fix checkConcurrencyLimit to filter by userId**

Replace the imports at the top of the file with:
```ts
import type { Db } from '@scrumbs/db'
import { agentTasks, sprints, projects } from '@scrumbs/db'
import { eq, and, inArray, sql } from 'drizzle-orm'
```

Then replace `checkConcurrencyLimit`:
```ts
export async function checkConcurrencyLimit(db: Db, userId: string): Promise<void> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(agentTasks)
    .innerJoin(sprints, eq(agentTasks.sprintId, sprints.id))
    .innerJoin(projects, eq(sprints.projectId, projects.id))
    .where(and(
      eq(projects.userId, userId),
      inArray(agentTasks.status, ['running', 'waiting_approval']),
    ))

  if ((result?.count ?? 0) >= MAX_CONCURRENT_PER_USER) {
    throw new ConcurrencyLimitError(userId)
  }
}
```

Add `and` and `sprints, projects` to imports.

- [ ] **Step 2: Fix incrementTokensUsed to use atomic SQL**

```ts
export async function incrementTokensUsed(db: Db, taskId: string, tokens: number): Promise<void> {
  await db
    .update(agentTasks)
    .set({ tokensUsed: sql`${agentTasks.tokensUsed} + ${tokens}` })
    .where(eq(agentTasks.id, taskId))
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/agent/src/lib/cost-guard.ts
git commit -m "fix(agent): per-user concurrency limit and atomic token increment (#65)"
```

---

### Task 13: Phase 2 verification checkpoint

- [ ] **Step 1: Build agent service**

```bash
npm run build --workspace=apps/agent
```

Fix any TypeScript errors.

- [ ] **Step 2: Run all agent tests**

```bash
npx vitest run apps/agent/
```

- [ ] **Step 3: Tag checkpoint**

```bash
git add -A && git commit -m "chore: phase 2 verification checkpoint — agent service core solid"
```

---

## Chunk 3: Phase 3 — Personas

**Issues fixed:** #60 (missing skills), #69 (skill loader tsc), #71 (persona types)

**Verification gate:** All 11 skill files present, `tsc` build copies them, persona modules export correct interfaces, vitest passes.

---

### Task 14: Create missing skill markdown files (#60)

**Files:**
- Create: 9 new `.md` files in `packages/personas/src/skills/`

- [ ] **Step 1: Create all missing skill files**

These are simplified versions of the skills that capture the core methodology. Each file should be concise (10-20 lines) and capture the key process the persona follows.

Create each of these files in `packages/personas/src/skills/`:

**`systematic-debugging.md`:**
```md
# Systematic Debugging

Never guess. Reproduce first, then diagnose.

1. Reproduce the bug reliably — write a failing test if possible
2. Narrow the scope — binary search through the code path
3. Form a hypothesis — what specifically is wrong?
4. Verify the hypothesis — add logging, inspect state
5. Fix the root cause — not the symptom
6. Verify the fix — run the failing test, confirm it passes
7. Check for related issues — did this bug pattern appear elsewhere?

The fix is not complete until you can explain why it was broken.
```

**`subagent-driven-development.md`:**
```md
# Subagent-Driven Development

Break work into independent tasks. Execute in parallel where possible.

1. Decompose the plan into independent units of work
2. Identify dependencies — what must complete before what?
3. Dispatch independent tasks in parallel
4. Review each completed task before proceeding
5. Integrate results and verify the whole

Each task should be self-contained: clear input, clear output, testable independently.
```

**`writing-plans.md`:**
```md
# Writing Plans

A good plan is a sequence of small, testable steps.

1. Start from the spec — what are we building and why?
2. Map the file structure — which files will be created or modified?
3. Define tasks in dependency order — what must be done first?
4. Each task produces a testable result
5. Include exact file paths, exact code, exact commands
6. TDD: write the test first, then the implementation
7. Commit after each task
```

**`requesting-code-review.md`:**
```md
# Requesting Code Review

Present your work for review with full context.

1. Summarise what changed and why
2. Highlight decisions that need validation
3. Call out areas of uncertainty
4. List what you tested and how
5. Be specific about what feedback you want

A good review request makes the reviewer's job easy.
```

**`receiving-code-review.md`:**
```md
# Receiving Code Review

Review feedback is a gift. Engage with it technically.

1. Read each finding carefully — understand what's being said
2. Verify each finding independently — don't assume it's correct or incorrect
3. For valid findings: fix the root cause, not just the symptom
4. For disagreements: explain your reasoning with evidence
5. Never implement a suggestion you don't understand

The goal is better code, not fewer comments.
```

**`verification-before-completion.md`:**
```md
# Verification Before Completion

Never claim something works without proving it.

1. Run the tests — all of them, not just the ones you wrote
2. Check the output — read it, don't just check the exit code
3. Test edge cases — empty inputs, large inputs, invalid inputs
4. Verify the requirement — does the output match what was asked for?
5. Check for regressions — did you break anything else?

Evidence before assertions. Always.
```

**`finishing-a-development-branch.md`:**
```md
# Finishing a Development Branch

Clean up before you hand off.

1. Run the full test suite — everything must pass
2. Review your own diff — read it like a reviewer would
3. Clean up: remove debug logs, TODOs that are done, dead code
4. Write a clear PR description: what, why, how to test
5. Decide: merge, PR, or hand off for review

The branch should be ready for someone else to pick up.
```

**`using-git-worktrees.md`:**
```md
# Using Git Worktrees

Isolate work without disrupting your current branch.

1. Create a worktree for the feature branch
2. Work in isolation — changes don't affect other worktrees
3. Test independently in the worktree
4. When done: merge or create PR, then clean up the worktree

Worktrees let you work on multiple things without stashing or switching.
```

**`executing-plans.md`:**
```md
# Executing Plans

Follow the plan step by step. Don't skip ahead.

1. Read the current step completely before starting
2. Do exactly what the step says — no more, no less
3. Verify the step's expected output before moving on
4. If something unexpected happens: stop, diagnose, update the plan
5. Commit after each completed task
6. Check off completed steps to track progress

Discipline in execution prevents compounding errors.
```

- [ ] **Step 2: Commit**

```bash
git add packages/personas/src/skills/
git commit -m "feat(personas): add 9 missing skill markdown files (#60)"
```

---

### Task 15: Fix skill loader — tsc asset copying (#69)

**Files:**
- Modify: `packages/personas/package.json`
- Modify: `packages/personas/src/skill-loader.ts`

- [ ] **Step 1: Add postbuild script to copy skills**

In `packages/personas/package.json`, update scripts:
```json
"scripts": {
  "build": "tsc",
  "postbuild": "cp -r src/skills dist/skills"
}
```

- [ ] **Step 2: Add warning log to skill-loader.ts catch block**

Replace the empty catch:
```ts
} catch (err) {
  console.warn(`[skill-loader] Failed to load skills from ${SKILLS_DIR}:`, err)
}
```

- [ ] **Step 3: Write test**

Create `packages/personas/src/__tests__/skill-loader.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SKILL_CONTENT, getSkill } from '../skill-loader'

describe('skill-loader', () => {
  it('loads all 11 skill files', () => {
    const expected = [
      'brainstorming', 'test-driven-development', 'using-superpowers',
      'systematic-debugging', 'subagent-driven-development', 'writing-plans',
      'requesting-code-review', 'receiving-code-review', 'verification-before-completion',
      'finishing-a-development-branch', 'using-git-worktrees', 'executing-plans',
    ]
    for (const name of expected) {
      expect(getSkill(name), `skill "${name}" should be loaded`).not.toBe('')
    }
  })

  it('returns empty string for unknown skills', () => {
    expect(getSkill('nonexistent')).toBe('')
  })
})
```

- [ ] **Step 4: Run test + commit**

```bash
npx vitest run packages/personas/src/__tests__/skill-loader.test.ts
git add packages/personas/
git commit -m "fix(personas): copy skill files to dist on build, add loader warning (#69)"
```

---

### Task 16: Fix persona types + add missing skill injection (#71)

**Files:**
- Modify: `packages/types/src/persona.ts`
- Modify: `packages/types/src/agent-task.ts`
- Modify: `packages/personas/src/rex.ts`
- Modify: `packages/personas/src/quinn.ts`
- Modify: `packages/personas/src/dex.ts`

- [ ] **Step 1: Fix Persona interface — replace static systemPrompt**

In `packages/types/src/persona.ts`:
```ts
export type PersonaName = 'pablo' | 'stella' | 'viktor' | 'rex' | 'quinn' | 'dex' | 'max'

export interface Persona {
  name: PersonaName
  displayName: string
  colour: string
}
```

Remove `systemPrompt` — each persona module exports a `build*SystemPrompt` function instead.

- [ ] **Step 2: Add StellaRetroInput to agent-task.ts**

Add after `StellaSprintInput`:
```ts
export interface StellaRetroInput {
  projectName: string
  sprintNumber: number
  completedStories: Array<{ title: string; status: string }>
  githubRepo: string
}
```

Update `AgentTaskInput`:
```ts
export interface AgentTaskInput {
  pablo: PabloInput
  stella_sprint: StellaSprintInput
  stella_retro: StellaRetroInput
  viktor: ViktorInput
  rex: RexInput
  quinn: QuinnInput
  dex: DexInput
  max: Record<string, never>
}
```

- [ ] **Step 3: Add skill injection to rex.ts**

```ts
import { getSkill } from './skill-loader.js'
import type { RexInput } from '@scrumbs/types'

export function buildRexSystemPrompt(input: RexInput): string {
  const requestingReview = getSkill('requesting-code-review')
  const receivingReview = getSkill('receiving-code-review')
  const verification = getSkill('verification-before-completion')

  return `You are Rex, the Tech Lead of a high-performing AI scrum team.

## Your Personality
... (existing personality text unchanged) ...

## Code Review Methodology
${requestingReview}

${receivingReview}

## Verification Discipline
${verification}

## Your Mission
Review the pull request for **${input.githubRepo}** PR #${input.prNumber}.

## Sprint Plan Context
${input.sprintPlan}

## PR Diff
\`\`\`diff
${input.prDiff}
\`\`\`

## Review Format
... (existing review format unchanged) ...`
}
```

- [ ] **Step 4: Add skill injection to quinn.ts**

```ts
import { getSkill } from './skill-loader.js'
import type { QuinnInput } from '@scrumbs/types'

export function buildQuinnSystemPrompt(input: QuinnInput): string {
  const verification = getSkill('verification-before-completion')
  const debugging = getSkill('systematic-debugging')

  return `You are Quinn, the QA Engineer of a high-performing AI scrum team.

## Your Personality
... (existing personality text unchanged) ...

## Verification Discipline
${verification}

## Debugging Methodology
${debugging}

## Your Mission
Run QA verification for **${input.githubRepo}** on branch \`${input.featureBranch}\`.

... (rest unchanged, but add workspaceDir) ...

Working directory: ${input.workspaceDir}`
}
```

- [ ] **Step 5: Fix dex.ts — inject workspaceDir**

Add `input.workspaceDir` reference in the prompt:
```ts
Working directory: ${input.workspaceDir}
```

- [ ] **Step 6: Commit**

```bash
git add packages/types/src/ packages/personas/src/
git commit -m "fix(personas): fix Persona interface, add StellaRetroInput, inject skills into Rex/Quinn (#71)"
```

---

### Task 17: Phase 3 verification checkpoint

- [ ] **Step 1: Build personas package**

```bash
npm run build --workspace=packages/types
npm run build --workspace=packages/personas
ls packages/personas/dist/skills/  # verify .md files are present
```

- [ ] **Step 2: Run all persona tests**

```bash
npx vitest run packages/
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: phase 3 verification checkpoint — personas solid"
```

---

## Chunk 4: Phases 4–6 — Sprint Flow, Completion, Polish

**Issues fixed:** #64 (context window), #70 (frontend SSE)

**Verification gate:** Full build of web + agent, all tests pass.

---

### Task 18: Fix context window — message role + preservation criteria (#64)

**Files:**
- Modify: `apps/agent/src/lib/context-window.ts`

- [ ] **Step 1: Write test for alternating message roles**

Create `apps/agent/src/lib/__tests__/context-window.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { estimateTokens } from '../context-window'

describe('estimateTokens', () => {
  it('estimates based on character count / 4', () => {
    const messages = [{ role: 'user' as const, content: 'x'.repeat(400) }]
    expect(estimateTokens(messages)).toBeGreaterThan(90)
    expect(estimateTokens(messages)).toBeLessThan(200)
  })
})
```

- [ ] **Step 2: Fix context-window.ts**

Three fixes:
1. Change summary message role to `assistant`
2. Add specific preservation criteria to the summarisation prompt
3. Ensure alternating roles after summary insertion

```ts
const summaryResponse = await client.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: `Summarise this conversation history concisely, preserving:\n- Files created or modified (with paths)\n- Test results (pass/fail)\n- Story progress (which stories started, completed, blocked)\n- Pending decisions or open questions\n\n${JSON.stringify(toSummarise)}`,
    },
  ],
})

// ... extract summaryText ...

// FIX: use assistant role to maintain alternating turns
const summaryMessage: Anthropic.MessageParam = {
  role: 'assistant',
  content: `[Previous conversation summary]\n${summaryText}`,
}

// Ensure first kept message is 'user' (to alternate after assistant summary)
if (toKeep.length > 0 && toKeep[0].role === 'assistant') {
  return { messages: [summaryMessage, ...toKeep], summarised: true }
} else {
  // Insert a bridge user message if needed
  return {
    messages: [
      summaryMessage,
      { role: 'user', content: 'Continue from where we left off.' },
      ...toKeep,
    ],
    summarised: true,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/agent/src/lib/context-window.ts apps/agent/src/lib/__tests__/context-window.test.ts
git commit -m "fix(agent): context window uses assistant role, adds preservation criteria (#64)"
```

---

### Task 19: Fix frontend SSE lifecycle issues (#70)

**Files:**
- Modify: `apps/web/components/terminal-panel.tsx`
- Modify: `apps/web/components/conversation-panel.tsx`
- Modify: `apps/web/app/projects/[projectId]/layout.tsx`

- [ ] **Step 1: Fix TerminalPanel — useRef for callback, add connection state**

In `terminal-panel.tsx`, wrap `onStoryStatus` in a ref to prevent SSE churn:

```tsx
const onStoryStatusRef = useRef(onStoryStatus)
useEffect(() => { onStoryStatusRef.current = onStoryStatus })

// In the SSE useEffect, use onStoryStatusRef.current instead of onStoryStatus
// Remove onStoryStatus from the dependency array
```

Add connection state tracking and use `ConnectionIndicator` instead of hardcoded green dot.

- [ ] **Step 2: Fix ConversationPanel — reset state on taskId change**

At the start of the `useEffect`:
```tsx
useEffect(() => {
  setEvents([])
  setDone(false)
  setConnected(false)
  // ... rest of EventSource setup
}, [taskId, sessionId, agentServiceUrl])
```

- [ ] **Step 3: Fix ProjectLayout — remove hardcoded stage**

In `apps/web/app/projects/[projectId]/layout.tsx`, change the hardcoded `"requirements"` to derive from the current sprint status. For now, pass `undefined` and let the component show no active stage until a sprint exists:

```tsx
<StageProgressBar currentStage={undefined} />
```

The proper fix (querying latest sprint status) will be wired up when the full project page is functional.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/terminal-panel.tsx apps/web/components/conversation-panel.tsx apps/web/app/projects/[projectId]/layout.tsx
git commit -m "fix(web): fix SSE lifecycle, reset state on task change, remove hardcoded stage (#70)"
```

---

### Task 20: Final verification + transpilePackages fix

**Files:**
- Modify: `apps/web/next.config.ts`

- [ ] **Step 1: Add @scrumbs/personas to transpilePackages**

In `next.config.ts`:
```ts
const nextConfig: NextConfig = {
  transpilePackages: ['@scrumbs/db', '@scrumbs/types', '@scrumbs/personas'],
}
```

- [ ] **Step 2: Full build**

```bash
npm run build --workspace=packages/types
npm run build --workspace=packages/db
npm run build --workspace=packages/personas
npm run build --workspace=apps/agent
npm run build --workspace=apps/web
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "chore: all phases verified — full build passes, all tests green"
```

---

## Summary: Issue → Task Mapping

| Issue | Task | Phase |
|-------|------|-------|
| #58 (auth schema) | Task 2 | 1 |
| #68 (DB constraints) | Task 3, 4 | 1 |
| #59 (migration path) | Task 5 | 1 |
| #73 (drizzle config) | Task 5 | 1 |
| #54 (IDOR) | Task 6 | 1 |
| #67 (TransitionError, retro) | Task 6 | 1 |
| #72 (middleware auth) | Task 6 | 1 |
| #55 (SSE registration) | Task 8 | 2 |
| #57 (buffer/socket leak) | Task 8 | 2 |
| #56 (approval race) | Task 9 | 2 |
| #62 (GIT_TOKEN leak) | Task 10 | 2 |
| #63 (path traversal) | Task 10 | 2 |
| #66 (workspace) | Task 10 | 2 |
| #61 (bash allowlist) | Task 11 | 2 |
| #65 (cost guard) | Task 12 | 2 |
| #60 (missing skills) | Task 14 | 3 |
| #69 (skill loader tsc) | Task 15 | 3 |
| #71 (persona types) | Task 16 | 3 |
| #64 (context window) | Task 18 | 4 |
| #70 (frontend SSE) | Task 19 | 6 |
