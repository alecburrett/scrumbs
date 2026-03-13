interface CreateTaskParams {
  sprintId: string
  personaName: string
  input: unknown
}

interface TaskResult {
  taskId: string
  sessionId: string
}

async function agentFetch(path: string, options?: RequestInit): Promise<Response> {
  const agentUrl = process.env.AGENT_SERVICE_URL
  const agentSecret = process.env.AGENT_SERVICE_SECRET
  if (!agentUrl || !agentSecret) throw new Error('Agent service not configured')
  return fetch(`${agentUrl}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      'x-agent-secret': agentSecret,
      'Content-Type': 'application/json',
    },
  })
}

export async function createAgentTask(params: CreateTaskParams): Promise<TaskResult> {
  const res = await agentFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(`Agent task creation failed: ${res.status}`)
  return res.json()
}

export async function approveAgentTask(taskId: string): Promise<void> {
  const res = await agentFetch(`/tasks/${taskId}/approve`, { method: 'POST' })
  if (!res.ok) throw new Error(`Approval failed: ${res.status}`)
}

export async function cancelAgentTask(taskId: string): Promise<void> {
  const res = await agentFetch(`/tasks/${taskId}/cancel`, { method: 'POST' })
  if (!res.ok) throw new Error(`Cancellation failed: ${res.status}`)
}
