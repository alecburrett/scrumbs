# Scrumbs — Foundation Build Loop

You are building the Scrumbs monorepo. The implementation plan is at `docs/plan-foundation.md`.

## Your job each iteration

1. Read `docs/plan-foundation.md`
2. Find the **first unchecked step** (`- [ ]`) that hasn't been completed
3. Execute that step exactly as written — run the commands, write the files, run the tests
4. When the step is complete, mark it as done: change `- [ ]` to `- [x]`
5. Commit any changes with a short descriptive message
6. If there are more unchecked steps, stop here — the loop will feed you this prompt again
7. If ALL steps are checked off, output: <promise>PLAN 1 COMPLETE</promise>

## Critical rules

- Working directory is `/home/alec/scrumbs`
- Always run tests after writing implementation — if tests fail, fix them before marking the step done
- Do NOT skip steps or mark them done without actually executing them
- If a step says "Run: X — Expected: FAIL", that's the TDD red step — a passing test here means something is wrong
- If a step says "Run: X — Expected: PASS", tests must pass before you mark it done
- For Human Prerequisites steps (Task 1): check if `.env.local` exists and all required vars are set. If missing, output what's needed and stop — do NOT mark the step done
- The `packages/db` migration step requires DATABASE_URL to be set in `.env.local`

## Current state awareness

Before each iteration, check:
- `git log --oneline -5` to see what's been done
- The checkbox state in `docs/plan-foundation.md` to find where you are
- Whether required files from previous steps exist

## Do NOT

- Skip ahead or batch multiple non-trivial steps in one go
- Rewrite files that already exist and are working
- Add features not in the plan
- Use `--no-verify` on commits
