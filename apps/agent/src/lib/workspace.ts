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
  if (!resolved.startsWith(path.resolve(workspaceDir) + path.sep) && resolved !== path.resolve(workspaceDir)) {
    throw new Error(`Path traversal attempt: ${filePath}`)
  }
  return resolved
}

export async function createWorkspace(taskId: string, repo: string, token: string): Promise<Workspace> {
  validateRepoFormat(repo)

  const dir = path.join(WORKSPACE_BASE, taskId)
  const askpassPath = path.join(WORKSPACE_BASE, `${taskId}-askpass.sh`)

  await fs.mkdir(WORKSPACE_BASE, { recursive: true })

  await fs.writeFile(askpassPath, '#!/bin/sh\necho "$GIT_TOKEN"\n', { mode: 0o700 })

  const gitEnv: NodeJS.ProcessEnv = {
    ...process.env,
    GIT_ASKPASS: askpassPath,
    GIT_TOKEN: token,
    GIT_TERMINAL_PROMPT: '0',
  }

  // Strip GIT_TOKEN from npm/test environment
  const { GIT_TOKEN: _token, GIT_ASKPASS: _askpass, ...cleanEnv } = gitEnv

  try {
    await execFileAsync('git', ['clone', `https://github.com/${repo}.git`, dir], { env: gitEnv })
    await execFileAsync('npm', ['install', '--prefer-offline'], { cwd: dir, env: cleanEnv })
  } catch (err) {
    // Clean up on failure
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
