import fs from 'node:fs/promises'
import { registerTool } from './index.js'
import { validateWorkspacePath } from '../workspace.js'
import { z } from 'zod'

registerTool({
  name: 'read_file',
  description: 'Read the contents of a file in the workspace',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path relative to workspace root' },
    },
    required: ['path'],
  },
  requiresApproval: false,
  async execute(input, context) {
    const { path: filePath } = z.object({ path: z.string() }).parse(input)
    const resolved = validateWorkspacePath(context.workspaceDir, filePath)
    const content = await fs.readFile(resolved, 'utf-8')
    return content
  },
})
