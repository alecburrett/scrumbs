import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { registerTool } from './index.js'

const execFileAsync = promisify(execFile)

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
    const { stdout, stderr } = await execFileAsync(command as string, args as string[], {
      cwd: context.workspaceDir,
      env: context.env,
      timeout: 60_000,
    })
    return `STDOUT:\n${stdout}\nSTDERR:\n${stderr}`
  },
})
