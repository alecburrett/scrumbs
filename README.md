# Scrumbs

### Your AI scrum team. Minus the standups.

Scrumbs wraps the Claude AI engine in a cast of agile personas — a product owner, scrum master, senior developer, tech lead, QA engineer, DevOps engineer, and tech ops lead. Together they guide you from a raw idea to a shipped feature, enforcing methodology so you never have to think about process.

**The experience:** You're working with a great team. The team just happens to be very fast, never sleeps, and always follows the process.

---

## Meet the Team

| | Name | Role | Motto |
|---|---|---|---|
| 📋 | **Pablo** | Product Owner | *"The value here is…"* |
| 🌀 | **Stella** | Scrum Master & Orchestrator | *"Let's get the right person on this."* |
| 🔴 | **Viktor** | Senior Developer | *"Red first, then green."* |
| 🏗️ | **Rex** | Tech Lead | *"LGTM — Let's improve this more."* |
| 🔍 | **Quinn** | QA Engineer | *"What if the user does this?"* |
| 🚀 | **Dex** | DevOps Engineer | *"We're green. Shipping."* |
| ⚡ | **Max** | Tech Operations | *"I can spin up three agents for this."* |

Each persona secretly runs a set of battle-tested agentic skills under the hood. You just talk to the team.

---

## How It Works

Every project in Scrumbs maps to a single GitHub repository.

**New project flow:**

```
Requirements → PRD → Sprint Planning → Dev Setup → Development → Review → QA → Deploy → Retro
    Pablo      Pablo      Stella          Max         Viktor       Rex    Quinn   Dex    Stella
```

**Returning project (new sprint):**

```
Sprint Planning → Dev Setup → Development → Review → QA → Deploy → Retro
    Stella           Max         Viktor       Rex    Quinn   Dex    Stella
```

Pablo writes the PRD once and updates it only when the scope changes. Stella runs every sprint ceremony and routes work to the right team member. Viktor writes the code. Rex reviews it. Quinn breaks it. Dex ships it.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL via Drizzle ORM
- **Auth:** NextAuth
- **AI:** Claude API (Anthropic)
- **Deployment:** Railway

---

## Status

🚧 **Active development** — the repo is currently in the pre-implementation phase. The product is fully specced and the team is ready to sprint.

See [`docs/PRD.md`](./docs/PRD.md) for the full product requirements document.
