import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { tmpdir } from 'node:os'
import fs from 'node:fs/promises'
import path from 'node:path'

const execFileAsync = promisify(execFile)
const WORKSPACE_BASE = path.join(tmpdir(), 'scrumbs')

export interface Workspace {
  dir: string
  env: NodeJS.ProcessEnv
  cleanup: () => Promise<void>
}

export async function createWorkspace(
  taskId: string,
  repo: string,
  token: string
): Promise<Workspace> {
  const dir = path.join(WORKSPACE_BASE, taskId)
  const askpassPath = path.join(WORKSPACE_BASE, `${taskId}-askpass.mjs`)

  await fs.mkdir(WORKSPACE_BASE, { recursive: true })
  await fs.mkdir(dir, { recursive: true })

  // Write GIT_ASKPASS helper script
  await fs.writeFile(
    askpassPath,
    '#!/usr/bin/env node\nprocess.stdout.write((process.env.GIT_TOKEN ?? "") + "\\n")\n',
    { mode: 0o700 }
  )

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GIT_ASKPASS: askpassPath,
    GIT_TOKEN: token,
    GIT_TERMINAL_PROMPT: '0',
  }

  // Clone repo — arguments as array (no shell interpolation)
  await execFileAsync(
    'git',
    ['clone', `https://github.com/${repo}.git`, dir],
    { env }
  )

  // Install dependencies
  await execFileAsync('npm', ['install', '--prefer-offline'], {
    cwd: dir,
    env,
  })

  return {
    dir,
    env,
    cleanup: async () => {
      await Promise.all([
        fs.rm(dir, { recursive: true, force: true }),
        fs.unlink(askpassPath).catch(() => {}),
      ])
    },
  }
}

export function validateWorkspacePath(workspaceDir: string, filePath: string): string {
  const resolved = path.resolve(workspaceDir, filePath)
  if (!resolved.startsWith(path.resolve(workspaceDir))) {
    throw new Error(`Path traversal attempt: ${filePath}`)
  }
  return resolved
}
