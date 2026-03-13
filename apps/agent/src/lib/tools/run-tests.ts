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
      let stdout = ''
      let stderr = ''
      if (err && typeof err === 'object') {
        if ('stdout' in err && typeof err.stdout === 'string') stdout = err.stdout
        if ('stderr' in err && typeof err.stderr === 'string') stderr = err.stderr
      }
      return `Tests failed:\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`
    }
  },
})
