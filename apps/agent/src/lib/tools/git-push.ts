import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { registerTool } from './index.js'

const execFileAsync = promisify(execFile)

registerTool({
  name: 'git_push',
  description: 'Push the current branch to origin',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  requiresApproval: true,
  async execute(_input, context) {
    const { stdout } = await execFileAsync(
      'git',
      ['push', '--set-upstream', 'origin', 'HEAD'],
      { cwd: context.workspaceDir, env: context.env }
    )
    return stdout
  },
})
