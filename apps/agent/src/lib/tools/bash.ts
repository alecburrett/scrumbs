import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { registerTool } from './index.js'

const execFileAsync = promisify(execFile)

export const ALLOWED_COMMANDS = new Set([
  'npm', 'npx', 'node', 'git', 'tsc', 'vitest',
  'cat', 'ls', 'find', 'mkdir', 'cp', 'mv', 'rm',
  'echo', 'head', 'tail', 'grep', 'wc', 'diff', 'sort', 'uniq',
])

// SECURITY: always use execFile with argument arrays — never exec() or shell interpolation
registerTool({
  name: 'bash',
  description: 'Run a shell command. Provide command and args separately for safety.',
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'The executable to run (e.g. "npm", "git")' },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Arguments as an array (never concatenated into a string)',
      },
    },
    required: ['command'],
  },
  requiresApproval: true,
  async execute({ command, args = [] }, context) {
    if (typeof command !== 'string') throw new Error('command must be a string')
    if (!Array.isArray(args) || !args.every((a) => typeof a === 'string')) {
      throw new Error('args must be an array of strings')
    }
    if (!ALLOWED_COMMANDS.has(command)) {
      throw new Error(`Command not permitted: ${command}. Allowed: ${[...ALLOWED_COMMANDS].join(', ')}`)
    }
    const { stdout, stderr } = await execFileAsync(command, args as string[], {
      cwd: context.workspaceDir,
      env: context.env,
      timeout: 60_000,
    })
    return `STDOUT:\n${stdout}\nSTDERR:\n${stderr}`
  },
})
