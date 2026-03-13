import fs from 'node:fs/promises'
import path from 'node:path'
import { registerTool } from './index.js'
import { validateWorkspacePath } from '../workspace.js'
import { z } from 'zod'

const WriteFileInputSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
})

registerTool({
  name: 'write_file',
  description: 'Write content to a file in the workspace',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path relative to workspace root' },
      content: { type: 'string', description: 'File content to write' },
    },
    required: ['path', 'content'],
  },
  requiresApproval: false,
  async execute(input, context) {
    const { path: filePath, content } = WriteFileInputSchema.parse(input)

    const resolved = validateWorkspacePath(context.workspaceDir, filePath)
    await fs.mkdir(path.dirname(resolved), { recursive: true })
    await fs.writeFile(resolved, content, 'utf-8')
    return `Written: ${filePath}`
  },
})
