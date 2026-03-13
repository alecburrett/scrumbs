import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { registerTool } from './index.js'
import { z } from 'zod'

const execFileAsync = promisify(execFile)

const GitCommitInputSchema = z.object({
  message: z.string().min(1),
})

registerTool({
  name: 'git_commit',
  description: 'Stage all changes and create a git commit',
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'Commit message' },
    },
    required: ['message'],
  },
  requiresApproval: false,
  async execute(input, context) {
    const { message } = GitCommitInputSchema.parse(input)
    await execFileAsync('git', ['add', '-A'], { cwd: context.workspaceDir, env: context.env })
    const { stdout } = await execFileAsync(
      'git',
      ['commit', '-m', message],
      { cwd: context.workspaceDir, env: context.env }
    )
    return stdout
  },
})
