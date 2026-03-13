import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { registerTool } from './index.js'
import { z } from 'zod'

const execFileAsync = promisify(execFile)

export const ALLOWED_COMMANDS = new Set([
  'npm', 'npx', 'node', 'git', 'tsc', 'vitest',
  'cat', 'ls', 'find', 'mkdir', 'cp', 'mv', 'rm',
  'echo', 'head', 'tail', 'grep', 'wc', 'diff', 'sort', 'uniq',
])

const BashInputSchema = z.object({
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
})

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
  async execute(input, context) {
    const { command, args } = BashInputSchema.parse(input)

    if (!ALLOWED_COMMANDS.has(command)) {
      throw new Error(`Command not permitted: ${command}. Allowed: ${[...ALLOWED_COMMANDS].join(', ')}`)
    }

    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: context.workspaceDir,
      env: context.env,
      timeout: 60_000,
    })
    return `STDOUT:\n${stdout}\nSTDERR:\n${stderr}`
  },
})
