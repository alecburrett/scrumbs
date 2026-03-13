import fs from 'node:fs/promises'
import path from 'node:path'
import { registerTool } from './index.js'
import { validateWorkspacePath } from '../workspace.js'

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
  async execute({ path: filePath, content }, context) {
    if (typeof filePath !== 'string') throw new Error('path must be a string')
    if (typeof content !== 'string') throw new Error('content must be a string')
    const resolved = validateWorkspacePath(context.workspaceDir, filePath)
    await fs.mkdir(path.dirname(resolved), { recursive: true })
    await fs.writeFile(resolved, content, 'utf-8')
    return `Written: ${filePath}`
  },
})
