import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { registerTool } from './index.js'

const execFileAsync = promisify(execFile)

registerTool({
  name: 'run_tests',
  description: 'Run the project test suite',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  requiresApproval: false,
  async execute(_input, context) {
    try {
      const { stdout, stderr } = await execFileAsync('npm', ['test'], {
        cwd: context.workspaceDir,
        env: context.env,
        timeout: 120_000,
      })
      return `STDOUT:\n${stdout}\nSTDERR:\n${stderr}`
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string }
      return `Tests failed:\nSTDOUT:\n${e.stdout ?? ''}\nSTDERR:\n${e.stderr ?? ''}`
    }
  },
})
