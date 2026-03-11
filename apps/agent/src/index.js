// Agent service stub — implemented in Plan 2
// Plan 2 will use Vercel AI SDK v6 ToolLoopAgent for persona execution:
//   import { ToolLoopAgent } from 'ai'
//   const agent = new ToolLoopAgent({ tools: viktor.tools, model: anthropic('claude-sonnet-4-6') })
// needsApproval tools will pause the loop and emit an SSE event awaiting user confirmation.
const http = require('http')
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: 'agent stub — Plan 2 not yet implemented' }))
})
server.listen(3001, () => console.log('Agent stub running on :3001'))
