# Scrumbs Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Scrumbs Turborepo monorepo with Railway deployment, Auth.js GitHub OAuth, Railway Postgres + Drizzle schema, and a working dashboard shell — enough that a logged-in user can create a project and see the sprint workflow screen.

**Architecture:** Turborepo monorepo with `apps/web` (Next.js 16), `apps/agent` (stub), and `packages/db` (shared Drizzle schema). Both apps deployed as separate Railway services sharing a single Railway Postgres database. Auth handled by Auth.js v5 (in-process, no external service).

**Tech Stack:** Turborepo, Next.js 16, TypeScript 5.9, Tailwind CSS v4, shadcn/ui, Auth.js v5 + `@auth/drizzle-adapter`, Drizzle ORM 0.45, Zod 4, Vitest 4, Railway

---

## ⚠️ Human Prerequisites — Complete Before Running Any Tasks

Two steps. Both require a browser.

### 1. GitHub OAuth App
1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. Set **Homepage URL**: `https://your-app.up.railway.app` (placeholder, update after deploy)
3. Set **Authorization callback URL**: `https://your-app.up.railway.app/api/auth/callback/github`
4. Click **Register application**
5. Copy **Client ID** → `AUTH_GITHUB_ID`
6. Click **Generate a new client secret** → `AUTH_GITHUB_SECRET`

### 2. Create `.env.local` in the repo root

```env
# Database (Railway provides this — copy from Railway project dashboard after Postgres service is added)
DATABASE_URL=postgresql://postgres:password@host:5432/railway

# Auth.js
AUTH_SECRET=                    # generate: openssl rand -hex 32
AUTH_URL=http://localhost:3000  # update to Railway URL after deploy

# GitHub OAuth App (from step 1)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Anthropic (used in Plan 2+)
ANTHROPIC_API_KEY=sk-ant-...

# Agent Service (stub — update after Plan 2 deploy)
AGENT_SERVICE_URL=http://localhost:3001
AGENT_SERVICE_SECRET=dev-secret-change-in-production
```

**The agent verifies this file exists before starting Task 1.** If any variable is missing, stop and surface the gap.

---

## Chunk 1: Monorepo Scaffold & Tooling

### File Map

| File | Purpose |
|------|---------|
| `package.json` | Root workspace (npm workspaces) |
| `turbo.json` | Turborepo pipeline config |
| `apps/web/package.json` | Next.js app dependencies |
| `apps/web/next.config.ts` | Next.js config |
| `apps/web/tailwind.config.ts` | Tailwind + persona colour tokens |
| `apps/web/components.json` | shadcn/ui config |
| `apps/web/vitest.config.ts` | Test runner |
| `apps/agent/package.json` | Agent service stub |
| `packages/db/package.json` | Shared DB package |
| `packages/types/package.json` | Shared TypeScript types |
| `railway.toml` | Root Railway config |
| `.env.example` | All required env vars documented |

---

### Task 1: Verify prerequisites

**Files:** none created

- [x] **Step 1: Verify .env.local exists and is populated**

```bash
test -f .env.local && echo "EXISTS" || echo "MISSING — stop and complete Human Prerequisites first"
```

Expected: `EXISTS`

- [x] **Step 2: Verify required vars are set**

```bash
source .env.local
for var in DATABASE_URL AUTH_SECRET AUTH_URL AUTH_GITHUB_ID AUTH_GITHUB_SECRET ANTHROPIC_API_KEY; do
  [ -z "${!var}" ] && echo "MISSING: $var" || echo "OK: $var"
done
```

Expected: all lines print `OK: ...`. If any print `MISSING`, stop and complete the Human Prerequisites section.

- [x] **Step 3: Verify Railway CLI is authenticated**

```bash
railway whoami
```

Expected: prints your Railway account email. If not, run `railway login`.

---

### Task 2: Initialise Turborepo monorepo

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `apps/web/` (Next.js)
- Create: `apps/agent/` (stub)
- Create: `packages/db/`
- Create: `packages/types/`

- [x] **Step 1: Create root package.json**

```bash
mkdir -p apps/web apps/agent packages/db packages/types
```

Create `package.json` (root):

```json
{
  "name": "scrumbs",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [x] **Step 2: Install Turborepo**

```bash
npm install
```

- [x] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

- [x] **Step 4: Bootstrap Next.js app inside apps/web**

```bash
cd apps/web
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint
cd ../..
```

> `create-next-app` will scaffold with Next.js 16. **Do NOT pass `--turbopack`** — Turbopack is the default bundler in Next.js 16 for both `next dev` and `next build`. No flag needed; adding it explicitly is a no-op (and wrong in some older 16.x RCs). Tailwind v4 is CSS-first — there is **no `tailwind.config.ts`** by default. Tokens are defined in `globals.css` using `@theme {}` blocks.

- [x] **Step 5: Install web app dependencies**

```bash
cd apps/web
npm install \
  next-auth@beta \
  @auth/drizzle-adapter \
  ai@^6.0.0 \
  @ai-sdk/anthropic@^3.0.0 \
  zod@^4.3.0 \
  @scrumbs/db \
  @scrumbs/types

npm install -D \
  vitest@^4.0.0 \
  @vitejs/plugin-react@^5.1.0 \
  @testing-library/react@^16.3.0 \
  @testing-library/user-event \
  @testing-library/jest-dom \
  jsdom \
  vite-tsconfig-paths
cd ../..
```

- [x] **Step 6: Create packages/types**

Create `packages/types/package.json`:

```json
{
  "name": "@scrumbs/types",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {}
}
```

Create `packages/types/src/index.ts`:

```typescript
export type ProjectStatus = 'active' | 'archived'

export type SprintStatus =
  | 'planning' | 'setup' | 'development'
  | 'review' | 'qa' | 'deploying' | 'complete'

export type StoryStatus = 'todo' | 'in_progress' | 'done'

export type ArtifactType =
  | 'requirements' | 'prd' | 'sprint-plan'
  | 'test-report' | 'review' | 'retro' | 'deploy-url'

export type PersonaName = 'pablo' | 'stella' | 'viktor' | 'rex' | 'quinn' | 'dex' | 'max'

export type Stage =
  | 'requirements' | 'prd' | 'planning' | 'setup'
  | 'development' | 'review' | 'qa' | 'deploy' | 'retro'

export type AgentTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  toolCalls?: unknown[]
}
```

- [x] **Step 7: Create agent stub**

Create `apps/agent/package.json`:

```json
{
  "name": "@scrumbs/agent",
  "version": "0.0.1",
  "scripts": {
    "dev": "node src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "@scrumbs/db": "*",
    "@scrumbs/types": "*"
  }
}
```

Create `apps/agent/src/index.js`:

```javascript
// Agent service stub — implemented in Plan 2
// Plan 2 will use Vercel AI SDK v6 ToolLoopAgent for persona execution:
//   import { ToolLoopAgent } from 'ai'
//   const agent = new ToolLoopAgent({ tools: viktor.tools, model: anthropic('claude-sonnet-4-6') })
// needsApproval tools will pause the loop and emit an SSE event awaiting user confirmation.
const http = require('http')
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: 'agent stub — Plan 2 not yet implemented' }))
})
server.listen(3001, () => console.log('Agent stub running on :3001'))
```

- [x] **Step 8: Create railway.toml at root**

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start --workspace=apps/web"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
```

- [x] **Step 9: Create .env.example**

Create `.env.example` at root:

```env
# Database (Railway Postgres — copy from Railway dashboard)
DATABASE_URL=postgresql://postgres:password@host:5432/railway

# Auth.js
AUTH_SECRET=your-generated-secret
AUTH_URL=https://your-app.up.railway.app
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app

# Agent service (apps/agent — filled in after Plan 2 deploy)
AGENT_SERVICE_URL=https://your-agent.up.railway.app
AGENT_SERVICE_SECRET=a-long-random-secret-min-32-chars
```

- [x] **Step 10: Add .gitignore**

```bash
cat >> .gitignore << 'EOF'
.env.local
.env.*.local
node_modules/
.next/
dist/
.turbo/
EOF
```

- [x] **Step 11: Commit**

```bash
git init
git add .
git commit -m "feat: initialise Turborepo monorepo with apps/web, apps/agent, packages/db, packages/types"
```

---

### Task 3: Tailwind v4 tokens + shadcn/ui

> **Tailwind v4 is CSS-first.** There is no `tailwind.config.ts`. Custom tokens are defined directly in `globals.css` using `@theme {}` blocks. CSS custom properties (`--color-*`) become Tailwind utilities automatically.

**Files:**
- Modify: `apps/web/src/app/globals.css` (add `@theme` token block)
- Create: `apps/web/src/test/setup.ts`
- Create: `apps/web/vitest.config.ts`

- [x] **Step 1: Install shadcn/ui in apps/web**

```bash
cd apps/web
npx shadcn@latest init --defaults
npx shadcn@latest add button card input label textarea \
  sidebar badge avatar separator skeleton toast \
  dialog dropdown-menu scroll-area tooltip
cd ../..
```

shadcn/ui supports Tailwind v4 natively — the init command detects the version automatically.

- [x] **Step 2: Write vitest config**

Create `apps/web/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

Create `apps/web/src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [x] **Step 3: Write failing colour token test**

In Tailwind v4 there is no config file to import, so we test that the CSS custom properties are present in `globals.css` instead.

Create `apps/web/src/test/tokens.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const css = readFileSync(resolve(__dirname, '../../src/app/globals.css'), 'utf-8')

describe('persona colour tokens (Tailwind v4 CSS custom properties)', () => {
  const personas = ['pablo', 'stella', 'viktor', 'rex', 'quinn', 'dex', 'max']

  it('defines all 7 persona colour tokens in globals.css', () => {
    personas.forEach(name => {
      expect(css).toContain(`--color-persona-${name}`)
    })
  })

  it('pablo is warm amber #F59E0B', () => {
    expect(css).toContain('--color-persona-pablo: #F59E0B')
  })

  it('defines terminal colour tokens', () => {
    expect(css).toContain('--color-terminal-bg')
    expect(css).toContain('--color-terminal-success')
    expect(css).toContain('--color-terminal-error')
  })
})
```

- [x] **Step 4: Run test to verify it fails**

```bash
cd apps/web && npx vitest run src/test/tokens.test.ts && cd ../..
```

Expected: FAIL — tokens not in globals.css yet

- [x] **Step 5: Add persona tokens to globals.css**

Edit `apps/web/src/app/globals.css` — add the `@theme` block after the existing `@import "tailwindcss"` line:

```css
@import "tailwindcss";

@theme {
  /* Persona accent colours */
  --color-persona-pablo:  #F59E0B;  /* warm amber  */
  --color-persona-stella: #6B9E6B;  /* sage green  */
  --color-persona-viktor: #3B82F6;  /* cool blue   */
  --color-persona-rex:    #7C3AED;  /* deep purple */
  --color-persona-quinn:  #F97316;  /* coral       */
  --color-persona-dex:    #06B6D4;  /* electric teal */
  --color-persona-max:    #64748B;  /* warm slate  */
  --color-persona-coach:  #EAB308;  /* gold        */

  /* Terminal panel colours */
  --color-terminal-bg:      #0F1117;
  --color-terminal-text:    #E5E7EB;
  --color-terminal-tool:    #6366F1;
  --color-terminal-output:  #E5E7EB;
  --color-terminal-success: #22C55E;
  --color-terminal-error:   #EF4444;
  --color-terminal-git:     #3B82F6;
  --color-terminal-file:    #22C55E;
}
```

These tokens are now available as Tailwind utilities: `bg-persona-pablo`, `text-terminal-success`, `border-persona-viktor`, etc.

- [x] **Step 6: Run test to verify it passes**

```bash
cd apps/web && npx vitest run src/test/tokens.test.ts && cd ../..
```

Expected: PASS

- [x] **Step 7: Add health check route**

Create `apps/web/src/app/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

- [x] **Step 8: Commit**

```bash
git add .
git commit -m "feat: add shadcn/ui, Vitest v4, persona tokens (Tailwind v4 CSS @theme), health check"
```

---

## Chunk 2: Shared Database Package (packages/db)

### File Map

| File | Purpose |
|------|---------|
| `packages/db/package.json` | Package config, exports Drizzle client + schema |
| `packages/db/src/schema.ts` | All Drizzle table definitions incl. `agent_tasks` |
| `packages/db/src/index.ts` | DB connection (exported for both web and agent) |
| `packages/db/drizzle.config.ts` | Drizzle Kit config (uses `DATABASE_MIGRATION_URL`) |
| `packages/db/src/migrations/` | Auto-generated SQL |

---

### Task 4: packages/db setup

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/drizzle.config.ts`

- [x] **Step 1: Create packages/db package.json**

```json
{
  "name": "@scrumbs/db",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "^0.45.1",
    "postgres": "^3.4.8",
    "@paralleldrive/cuid2": "^3.3.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.9"
  }
}
```

- [x] **Step 2: Install packages/db dependencies**

```bash
cd packages/db && npm install && cd ../..
```

- [ ] **Step 3: Write failing schema shape test**

Create `packages/db/src/schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { users, accounts, projects, sprints, stories, artifacts, conversations, agentTasks } from './schema'

describe('database schema', () => {
  it('projects has required columns', () => {
    expect(Object.keys(projects)).toContain('id')
    expect(Object.keys(projects)).toContain('userId')
    expect(Object.keys(projects)).toContain('githubRepo')
  })

  it('sprints has required columns', () => {
    expect(Object.keys(sprints)).toContain('projectId')
    expect(Object.keys(sprints)).toContain('number')
    expect(Object.keys(sprints)).toContain('status')
  })

  it('agentTasks has sessionId for SSE reconnection', () => {
    expect(Object.keys(agentTasks)).toContain('sessionId')
    expect(Object.keys(agentTasks)).toContain('status')
    expect(Object.keys(agentTasks)).toContain('sprintId')
  })

  it('artifacts can be project-level (nullable sprintId)', () => {
    expect(Object.keys(artifacts)).toContain('projectId')
    expect(Object.keys(artifacts)).toContain('sprintId')
  })
})
```

- [x] **Step 4: Run test to verify it fails**

```bash
cd packages/db && npx vitest run src/schema.test.ts && cd ../..
```

Expected: FAIL — schema not found

- [x] **Step 5: Write the Drizzle schema**

Create `packages/db/src/schema.ts`:

```typescript
import { pgTable, text, timestamp, integer, jsonb, pgEnum, primaryKey } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import type { AdapterAccountType } from 'next-auth/adapters'

// ── Auth.js required tables ───────────────────────────────────────────────────
export const users = pgTable('users', {
  id:            text('id').primaryKey().$defaultFn(() => createId()),
  name:          text('name'),
  email:         text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image:         text('image'),
  githubLogin:   text('github_login'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
})

export const accounts = pgTable(
  'accounts',
  {
    userId:            text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type:              text('type').$type<AdapterAccountType>().notNull(),
    provider:          text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token:     text('refresh_token'),
    access_token:      text('access_token'),
    expires_at:        integer('expires_at'),
    token_type:        text('token_type'),
    id_token:          text('id_token'),
    scope:             text('scope'),
    session_state:     text('session_state'),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
)
// ─────────────────────────────────────────────────────────────────────────────

export const projectStatusEnum   = pgEnum('project_status',    ['active', 'archived'])
export const sprintStatusEnum    = pgEnum('sprint_status',     ['planning', 'setup', 'development', 'review', 'qa', 'deploying', 'complete'])
export const storyStatusEnum     = pgEnum('story_status',      ['todo', 'in_progress', 'done'])
export const artifactTypeEnum    = pgEnum('artifact_type',     ['requirements', 'prd', 'sprint-plan', 'test-report', 'review', 'retro', 'deploy-url'])
export const personaEnum         = pgEnum('persona',           ['pablo', 'stella', 'viktor', 'rex', 'quinn', 'dex', 'max'])
export const stageEnum           = pgEnum('stage',             ['requirements', 'prd', 'planning', 'setup', 'development', 'review', 'qa', 'deploy', 'retro'])
export const agentTaskStatusEnum = pgEnum('agent_task_status', ['pending', 'running', 'completed', 'failed', 'cancelled'])

export const projects = pgTable('projects', {
  id:            text('id').primaryKey().$defaultFn(() => createId()),
  userId:        text('user_id').notNull(),
  name:          text('name').notNull(),
  description:   text('description'),
  githubRepo:    text('github_repo').notNull(),
  defaultBranch: text('default_branch').notNull().default('main'),
  status:        projectStatusEnum('status').notNull().default('active'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  updatedAt:     timestamp('updated_at').notNull().defaultNow(),
})

export const sprints = pgTable('sprints', {
  id:            text('id').primaryKey().$defaultFn(() => createId()),
  projectId:     text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  number:        integer('number').notNull(),
  goal:          text('goal'),
  status:        sprintStatusEnum('status').notNull().default('planning'),
  featureBranch: text('feature_branch'),
  prUrl:         text('pr_url'),
  deployUrl:     text('deploy_url'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  completedAt:   timestamp('completed_at'),
})

export const stories = pgTable('stories', {
  id:                 text('id').primaryKey().$defaultFn(() => createId()),
  sprintId:           text('sprint_id').notNull().references(() => sprints.id, { onDelete: 'cascade' }),
  title:              text('title').notNull(),
  description:        text('description'),
  points:             integer('points'),
  status:             storyStatusEnum('status').notNull().default('todo'),
  acceptanceCriteria: text('acceptance_criteria'),
  order:              integer('order').notNull().default(0),
})

export const agentTasks = pgTable('agent_tasks', {
  id:          text('id').primaryKey().$defaultFn(() => createId()),
  projectId:   text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sprintId:    text('sprint_id').references(() => sprints.id, { onDelete: 'cascade' }),
  stage:       stageEnum('stage').notNull(),
  persona:     personaEnum('persona').notNull(),
  status:      agentTaskStatusEnum('status').notNull().default('pending'),
  input:       jsonb('input').notNull().default({}),
  output:      jsonb('output').default({}),
  error:       text('error'),
  sessionId:   text('session_id'),   // browser uses this to reconnect to SSE stream
  startedAt:   timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
})

export const artifacts = pgTable('artifacts', {
  id:        text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sprintId:  text('sprint_id').references(() => sprints.id, { onDelete: 'cascade' }),
  type:      artifactTypeEnum('type').notNull(),
  content:   text('content').notNull().default(''),
  commitSha: text('commit_sha'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const conversations = pgTable('conversations', {
  id:        text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sprintId:  text('sprint_id').references(() => sprints.id, { onDelete: 'cascade' }),
  stage:     stageEnum('stage').notNull(),
  persona:   personaEnum('persona').notNull(),
  messages:  jsonb('messages').notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

```

> **Security note:** All DB access is server-side via Drizzle using `DATABASE_URL`. Data isolation is enforced by the service layer (`where eq(table.userId, user.id)`) on every query.

- [x] **Step 6: Write DB connection**

Create `packages/db/src/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const client = postgres(connectionString, { max: 10 })
export const db = drizzle(client, { schema })
export * from './schema'
```

- [x] **Step 7: Write drizzle.config.ts**

Create `packages/db/drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Use Session pooler URL for migrations (not Transaction pooler)
    url: process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL!,
  },
} satisfies Config
```

- [x] **Step 8: Run schema test to verify it passes**

```bash
cd packages/db && npx vitest run src/schema.test.ts && cd ../..
```

Expected: PASS

- [x] **Step 9: Generate and apply migrations**

```bash
cd packages/db
source ../../.env.local
npx drizzle-kit generate
npx drizzle-kit migrate
cd ../..
```

Expected: migration files created in `packages/db/src/migrations/`, applied successfully.
> Note: migration generated (0000_chemical_carlie_cooper.sql). Apply deferred to Task 8 (Railway deploy) — DATABASE_URL is placeholder until Railway Postgres provisioned.

- [x] **Step 10: Commit**

```bash
git add packages/db/ packages/types/
git commit -m "feat: add shared packages/db with Drizzle schema (incl. agent_tasks) and packages/types"
```

---

## Chunk 3: Auth.js v5 + GitHub OAuth

### File Map

| File | Purpose |
|------|---------|
| `apps/web/src/auth.ts` | NextAuth config — GitHub provider + Drizzle adapter |
| `apps/web/src/app/api/auth/[...nextauth]/route.ts` | Auth.js route handler (handles OAuth flow internally) |
| `apps/web/src/middleware.ts` | One-line auth guard |
| `apps/web/src/app/login/page.tsx` | Login page |
| `apps/web/src/components/auth/SignInButton.tsx` | GitHub sign-in button |

---

### Task 5: Auth.js config + middleware

- [x] **Step 1: Write failing test**

Create `apps/web/src/test/auth.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

describe('auth config', () => {
  it('exports handlers, auth, signIn, signOut', async () => {
    const authModule = await import('@/auth')
    expect(typeof authModule.handlers).toBe('object')
    expect(typeof authModule.auth).toBe('function')
    expect(typeof authModule.signIn).toBe('function')
    expect(typeof authModule.signOut).toBe('function')
  })
})
```

- [x] **Step 2: Run to verify it fails**

```bash
cd apps/web && npx vitest run src/test/auth.test.ts && cd ../..
```

Expected: FAIL — `@/auth` module not found

- [x] **Step 3: Create auth.ts**

Create `apps/web/src/auth.ts`:

```typescript
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db, users, accounts } from '@scrumbs/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, { usersTable: users, accountsTable: accounts }),
  providers: [
    GitHub({
      authorization: { params: { scope: 'read:user repo' } },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) token.accessToken = account.access_token
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      return session
    },
  },
  pages: { signIn: '/login' },
})
```

- [x] **Step 4: Create route handler**

Create `apps/web/src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/auth'
export const { GET, POST } = handlers
```

- [x] **Step 5: Create one-line middleware**

Create `apps/web/src/middleware.ts`:

```typescript
export { auth as middleware } from '@/auth'

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)'],
}
```

- [x] **Step 6: Run test to verify it passes**

```bash
cd apps/web && npx vitest run src/test/auth.test.ts && cd ../..
```

Expected: PASS

- [x] **Step 7: Write login page + sign-in button**

Create `apps/web/src/app/login/page.tsx`:

```typescript
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { SignInButton } from '@/components/auth/SignInButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await auth()
  if (session) redirect('/dashboard')

  const { error } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Scrumbs</h1>
        <p className="text-muted-foreground">Your AI scrum team, ready to ship.</p>
        {error && (
          <p className="text-sm text-destructive">Authentication failed. Please try again.</p>
        )}
        <SignInButton />
      </div>
    </main>
  )
}
```

Create `apps/web/src/components/auth/SignInButton.tsx`:

```typescript
'use client'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'

export function SignInButton() {
  return (
    <Button
      onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
      className="w-full gap-2"
      size="lg"
    >
      <Github className="h-5 w-5" />
      Continue with GitHub
    </Button>
  )
}
```

- [x] **Step 8: Commit**

```bash
git add apps/web/src/
git commit -m "feat: add Auth.js v5 GitHub OAuth, one-line middleware, login page"
```

---

## Chunk 4: Service Layer (TDD)

### File Map

| File | Purpose |
|------|---------|
| `apps/web/src/lib/services/projects.ts` | Project CRUD |
| `apps/web/src/lib/services/sprints.ts` | Sprint CRUD |
| `apps/web/src/test/services/projects.test.ts` | Unit tests |
| `apps/web/src/test/services/sprints.test.ts` | Unit tests |
| `apps/web/src/app/api/projects/route.ts` | REST: GET list + POST |
| `apps/web/src/app/api/projects/[id]/route.ts` | REST: GET + DELETE |
| `apps/web/src/app/api/sprints/route.ts` | REST: POST create |

---

### Task 6: Project service (TDD)

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/test/services/projects.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@scrumbs/db', () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}))

import { createProject, getProjectsByUser } from '@/lib/services/projects'

describe('project service', () => {
  it('rejects empty userId', async () => {
    await expect(createProject({ userId: '', name: 'X', githubRepo: 'a/b' }))
      .rejects.toThrow('userId is required')
  })

  it('rejects invalid githubRepo format', async () => {
    await expect(createProject({ userId: 'u1', name: 'X', githubRepo: 'notvalid' }))
      .rejects.toThrow('owner/repo format')
  })

  it('rejects empty name', async () => {
    await expect(createProject({ userId: 'u1', name: '', githubRepo: 'a/b' }))
      .rejects.toThrow('name is required')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd apps/web && npx vitest run src/test/services/projects.test.ts && cd ../..
```

Expected: FAIL

- [ ] **Step 3: Write project service**

Create `apps/web/src/lib/services/projects.ts`:

```typescript
import { db, projects } from '@scrumbs/db'
import { eq } from 'drizzle-orm'

interface CreateProjectInput {
  userId: string
  name: string
  githubRepo: string
  description?: string
  defaultBranch?: string
}

export async function getProjectsByUser(userId: string) {
  return db.select().from(projects).where(eq(projects.userId, userId))
}

export async function getProjectById(id: string, userId: string) {
  const rows = await db.select().from(projects).where(eq(projects.id, id))
  const project = rows[0]
  if (!project || project.userId !== userId) return null
  return project
}

export async function createProject(input: CreateProjectInput) {
  if (!input.userId) throw new Error('userId is required')
  if (!input.name?.trim()) throw new Error('name is required')
  if (!/^[\w.-]+\/[\w.-]+$/.test(input.githubRepo))
    throw new Error('githubRepo must be in owner/repo format')

  const rows = await db.insert(projects).values({
    userId: input.userId,
    name: input.name.trim(),
    description: input.description,
    githubRepo: input.githubRepo,
    defaultBranch: input.defaultBranch ?? 'main',
  }).returning()

  return rows[0]
}

export async function archiveProject(id: string, userId: string) {
  const project = await getProjectById(id, userId)
  if (!project) throw new Error('Project not found')
  await db.update(projects).set({ status: 'archived', updatedAt: new Date() }).where(eq(projects.id, id))
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd apps/web && npx vitest run src/test/services/projects.test.ts && cd ../..
```

Expected: PASS

- [ ] **Step 5: Write sprint service with tests**

Create `apps/web/src/test/services/sprints.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@scrumbs/db', () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}))

import { createSprint, getNextSprintNumber } from '@/lib/services/sprints'

describe('sprint service', () => {
  it('rejects empty projectId', async () => {
    await expect(createSprint({ projectId: '' })).rejects.toThrow('projectId is required')
  })

  it('getNextSprintNumber returns 1 when no sprints exist', async () => {
    const { db } = await import('@scrumbs/db')
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    } as any)
    expect(await getNextSprintNumber('proj-1')).toBe(1)
  })

  it('getNextSprintNumber increments from last sprint', async () => {
    const { db } = await import('@scrumbs/db')
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ number: 3 }]),
    } as any)
    expect(await getNextSprintNumber('proj-1')).toBe(4)
  })
})
```

- [ ] **Step 6: Run to verify it fails**

```bash
cd apps/web && npx vitest run src/test/services/sprints.test.ts && cd ../..
```

Expected: FAIL

- [ ] **Step 7: Write sprint service**

Create `apps/web/src/lib/services/sprints.ts`:

```typescript
import { db, sprints } from '@scrumbs/db'
import { eq, desc } from 'drizzle-orm'

export async function getNextSprintNumber(projectId: string): Promise<number> {
  const rows = await db.select().from(sprints)
    .where(eq(sprints.projectId, projectId))
    .orderBy(desc(sprints.number))
    .limit(1)
  return rows.length === 0 ? 1 : rows[0].number + 1
}

export async function createSprint(input: { projectId: string; goal?: string }) {
  if (!input.projectId) throw new Error('projectId is required')
  const number = await getNextSprintNumber(input.projectId)
  const rows = await db.insert(sprints).values({
    projectId: input.projectId,
    number,
    goal: input.goal,
  }).returning()
  return rows[0]
}

export async function getSprintsByProject(projectId: string) {
  return db.select().from(sprints).where(eq(sprints.projectId, projectId))
}

export async function updateSprintStatus(id: string, status: typeof sprints.$inferSelect.status) {
  await db.update(sprints).set({ status }).where(eq(sprints.id, id))
}
```

- [ ] **Step 8: Run to verify it passes**

```bash
cd apps/web && npx vitest run src/test/services/sprints.test.ts && cd ../..
```

Expected: PASS

- [ ] **Step 9: Write API routes**

Create `apps/web/src/app/api/projects/route.ts`:

```typescript
import { auth } from '@/auth'
import { getProjectsByUser, createProject } from '@/lib/services/projects'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getProjectsByUser(session.user.id))
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const project = await createProject({ userId: session.user.id, ...body })
    return NextResponse.json(project, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}
```

Create `apps/web/src/app/api/projects/[id]/route.ts`:

```typescript
import { auth } from '@/auth'
import { getProjectById, archiveProject } from '@/lib/services/projects'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const project = await getProjectById(id, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await archiveProject(id, session.user.id)
  return NextResponse.json({ ok: true })
}
```

Create `apps/web/src/app/api/sprints/route.ts`:

```typescript
import { auth } from '@/auth'
import { getProjectById } from '@/lib/services/projects'
import { createSprint } from '@/lib/services/sprints'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const project = await getProjectById(body.projectId, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const sprint = await createSprint({ projectId: body.projectId })
  return NextResponse.json(sprint, { status: 201 })
}
```

- [ ] **Step 10: Run all tests**

```bash
cd apps/web && npx vitest run && cd ../..
```

Expected: all PASS

- [ ] **Step 11: Commit**

```bash
git add apps/web/src/
git commit -m "feat: project + sprint service layer and API routes (TDD)"
```

---

## Chunk 5: Dashboard Shell

### File Map

| File | Purpose |
|------|---------|
| `apps/web/src/app/dashboard/layout.tsx` | Auth check + sidebar |
| `apps/web/src/app/dashboard/page.tsx` | Project list |
| `apps/web/src/app/dashboard/projects/new/page.tsx` | New project form |
| `apps/web/src/app/dashboard/projects/[projectId]/page.tsx` | Project detail |
| `apps/web/src/app/dashboard/projects/[projectId]/sprints/[sprintId]/page.tsx` | Sprint stub |
| `apps/web/src/components/dashboard/Sidebar.tsx` | Sidebar with project list |
| `apps/web/src/components/dashboard/StageProgress.tsx` | 9-stage progress bar |
| `apps/web/src/components/project/NewProjectForm.tsx` | New project form |

(Tests and components match prior versions — paths updated for monorepo structure)

---

### Task 7: Sidebar, dashboard pages, stage progress, new project form

> **React Compiler note:** Next.js 16 enables the React Compiler by default. Do NOT add manual `useMemo`, `useCallback`, or `memo()` to these components — the compiler handles render optimisation automatically. Adding them manually may interfere with compiler analysis and introduces unnecessary complexity.

- [ ] **Step 1: Write and run sidebar test**

Create `apps/web/src/test/components/Sidebar.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Sidebar } from '@/components/dashboard/Sidebar'

describe('Sidebar', () => {
  it('renders project name', () => {
    render(<Sidebar projects={[{ id: '1', name: 'My App', githubRepo: 'a/b', status: 'active' }]} currentProjectId={null} />)
    expect(screen.getByText('My App')).toBeInTheDocument()
  })
  it('renders new project link', () => {
    render(<Sidebar projects={[]} currentProjectId={null} />)
    expect(screen.getByText('New Project')).toBeInTheDocument()
  })
})
```

```bash
cd apps/web && npx vitest run src/test/components/Sidebar.test.tsx && cd ../..
```

Expected: FAIL

- [ ] **Step 2: Write Sidebar component**

Create `apps/web/src/components/dashboard/Sidebar.tsx`:

```typescript
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Project { id: string; name: string; githubRepo: string; status: string }
interface SidebarProps { projects: Project[]; currentProjectId: string | null }

export function Sidebar({ projects, currentProjectId }: SidebarProps) {
  const active = projects.filter(p => p.status === 'active')
  return (
    <aside className="w-64 border-r bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="font-bold text-xl tracking-tight">Scrumbs</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your AI scrum team</p>
      </div>
      <ScrollArea className="flex-1 p-2">
        {active.map(p => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
            <div className={cn(
              'px-3 py-2 rounded-md text-sm cursor-pointer transition-colors hover:bg-accent',
              currentProjectId === p.id && 'bg-accent font-medium'
            )}>
              <div className="font-medium truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground truncate">{p.githubRepo}</div>
            </div>
          </Link>
        ))}
      </ScrollArea>
      <div className="p-3 border-t">
        <Link href="/dashboard/projects/new">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </Link>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Run sidebar test to verify it passes**

```bash
cd apps/web && npx vitest run src/test/components/Sidebar.test.tsx && cd ../..
```

Expected: PASS

- [ ] **Step 4: Write StageProgress component with test**

Create `apps/web/src/test/components/StageProgress.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StageProgress } from '@/components/dashboard/StageProgress'

describe('StageProgress', () => {
  it('renders all 7 stage labels', () => {
    render(<StageProgress currentStage="development" completedStages={[]} />)
    expect(screen.getByText('Planning')).toBeInTheDocument()
    expect(screen.getByText('Development')).toBeInTheDocument()
    expect(screen.getByText('Deploy')).toBeInTheDocument()
  })
  it('marks current stage', () => {
    render(<StageProgress currentStage="development" completedStages={[]} />)
    expect(screen.getByTestId('stage-development')).toHaveClass('current')
  })
  it('marks completed stages', () => {
    render(<StageProgress currentStage="development" completedStages={['planning', 'setup']} />)
    expect(screen.getByTestId('stage-planning')).toHaveClass('completed')
  })
})
```

```bash
cd apps/web && npx vitest run src/test/components/StageProgress.test.tsx && cd ../..
```

Expected: FAIL

Create `apps/web/src/components/dashboard/StageProgress.tsx`:

```typescript
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

type Stage = 'planning' | 'setup' | 'development' | 'review' | 'qa' | 'deploy' | 'retro'

const LABELS: Record<Stage, string> = {
  planning: 'Planning', setup: 'Setup', development: 'Development',
  review: 'Review', qa: 'QA', deploy: 'Deploy', retro: 'Retro',
}
const OWNERS: Record<Stage, string> = {
  planning: 'Stella', setup: 'Max', development: 'Viktor',
  review: 'Rex', qa: 'Quinn', deploy: 'Dex', retro: 'Stella',
}
const ALL: Stage[] = ['planning', 'setup', 'development', 'review', 'qa', 'deploy', 'retro']

export function StageProgress({ currentStage, completedStages }: { currentStage: Stage; completedStages: Stage[] }) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b overflow-x-auto">
      {ALL.map((stage, i) => {
        const done = completedStages.includes(stage)
        const current = stage === currentStage
        return (
          <div key={stage} className="flex items-center gap-1 shrink-0">
            <div
              data-testid={`stage-${stage}`}
              className={cn(
                'flex flex-col items-center px-3 py-1.5 rounded-md text-xs transition-colors',
                done && 'completed bg-primary/10 text-primary',
                current && 'current bg-primary text-primary-foreground font-medium',
                !done && !current && 'text-muted-foreground opacity-50',
              )}
            >
              <div className="flex items-center gap-1">
                {done && <Check className="h-3 w-3" />}
                <span>{LABELS[stage]}</span>
              </div>
              <span className="text-[10px] opacity-70">{OWNERS[stage]}</span>
            </div>
            {i < ALL.length - 1 && <div className={cn('w-4 h-px', done ? 'bg-primary/40' : 'bg-border')} />}
          </div>
        )
      })}
    </div>
  )
}
```

```bash
cd apps/web && npx vitest run src/test/components/StageProgress.test.tsx && cd ../..
```

Expected: PASS

- [ ] **Step 5: Write NewProjectForm with test**

Create `apps/web/src/test/components/NewProjectForm.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { NewProjectForm } from '@/components/project/NewProjectForm'

describe('NewProjectForm', () => {
  it('shows validation error for invalid repo', async () => {
    render(<NewProjectForm onSubmit={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('GitHub Repository'), { target: { value: 'notvalid' } })
    fireEvent.blur(screen.getByLabelText('GitHub Repository'))
    expect(await screen.findByText(/owner\/repo format/i)).toBeInTheDocument()
  })
  it('calls onSubmit with correct data', () => {
    const onSubmit = vi.fn()
    render(<NewProjectForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('Project Name'), { target: { value: 'My App' } })
    fireEvent.change(screen.getByLabelText('GitHub Repository'), { target: { value: 'owner/my-app' } })
    fireEvent.click(screen.getByText('Create Project'))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'My App', githubRepo: 'owner/my-app' }))
  })
})
```

```bash
cd apps/web && npx vitest run src/test/components/NewProjectForm.test.tsx && cd ../..
```

Expected: FAIL. Then write the component (same implementation as previous plan version, path updated).

Create `apps/web/src/components/project/NewProjectForm.tsx` — same implementation as original plan.

```bash
cd apps/web && npx vitest run src/test/components/NewProjectForm.test.tsx && cd ../..
```

Expected: PASS

- [ ] **Step 6: Write all dashboard pages**

Write these pages (same implementation as previous plan, all paths updated to `apps/web/src/`):

- `apps/web/src/app/dashboard/layout.tsx`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/dashboard/projects/new/page.tsx`
- `apps/web/src/app/dashboard/projects/[projectId]/page.tsx`
- `apps/web/src/app/dashboard/projects/[projectId]/sprints/[sprintId]/page.tsx`

- [ ] **Step 7: Run all tests**

```bash
cd apps/web && npx vitest run && cd ../..
```

Expected: all PASS

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: dashboard shell — sidebar, stage progress, project pages, sprint stub (all TDD)"
```

---

## Chunk 6: Railway Deployment

### Task 8: Deploy to Railway

- [ ] **Step 1: Verify Railway CLI is linked**

```bash
railway status
```

Expected: shows linked project. If not: `railway link`.

- [ ] **Step 2: Add Postgres service via Railway CLI**

```bash
railway add --database postgres
```

Expected: Postgres provisioned. Railway sets `DATABASE_URL` automatically in the service environment.

- [ ] **Step 3: Set environment variables**

```bash
railway variables set \
  AUTH_SECRET="$(grep AUTH_SECRET .env.local | cut -d= -f2-)" \
  AUTH_URL="https://your-app.up.railway.app" \
  AUTH_GITHUB_ID="$(grep AUTH_GITHUB_ID .env.local | cut -d= -f2-)" \
  AUTH_GITHUB_SECRET="$(grep AUTH_GITHUB_SECRET .env.local | cut -d= -f2-)" \
  ANTHROPIC_API_KEY="$(grep ANTHROPIC_API_KEY .env.local | cut -d= -f2-)" \
  AGENT_SERVICE_SECRET="$(grep AGENT_SERVICE_SECRET .env.local | cut -d= -f2-)"
```

> `DATABASE_URL` is set automatically by Railway when a Postgres service is linked — no need to set it manually.

- [ ] **Step 4: Run migrations on Railway**

```bash
railway run --service postgres npx drizzle-kit migrate
```

Or if that doesn't work:

```bash
DATABASE_MIGRATION_URL=$(railway variables get DATABASE_URL) npx --prefix packages/db drizzle-kit migrate
```

- [ ] **Step 5: Deploy**

```bash
railway up
```

- [ ] **Step 6: Verify deployment**

```bash
RAILWAY_URL=$(railway domain)
curl "https://$RAILWAY_URL/api/health"
```

Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 7: Update NEXT_PUBLIC_APP_URL**

```bash
railway variables set NEXT_PUBLIC_APP_URL="https://$(railway domain)"
railway up  # redeploy with updated var
```

- [ ] **Step 8: Final commit**

```bash
git add .env.example railway.toml
git commit -m "docs: update .env.example with final Railway URL pattern"
```

---

## Plan 1 Complete ✅

**What's working:**
- Turborepo monorepo: `apps/web`, `apps/agent` (stub), `packages/db`, `packages/types`
- Shared Drizzle schema with `agent_tasks` table (reconnectable SSE sessions)
- GitHub OAuth via Auth.js v5, one-line middleware, JWT sessions in Railway Postgres
- Project + sprint service layer (fully TDD)
- Dashboard shell live on Railway

**Plans 2–5 can now import `@scrumbs/db` and `@scrumbs/types` without refactoring.**
