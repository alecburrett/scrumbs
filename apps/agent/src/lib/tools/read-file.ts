import fs from 'node:fs/promises'
import { registerTool } from './index.js'
import { validateWorkspacePath } from '../workspace.js'
import { z } from 'zod'

const ReadFileInputSchema = z.object({
  path: z.string().min(1),
})

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
    const { path: filePath } = ReadFileInputSchema.parse(input)
    const resolved = validateWorkspacePath(context.workspaceDir, filePath)
    const content = await fs.readFile(resolved, 'utf-8')
    return content
  },
})
