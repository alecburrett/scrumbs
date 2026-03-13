const APPROVAL_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

const gates = new Map<string, (approved: boolean) => void>()

export function waitForApproval(taskId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      gates.delete(taskId)
      reject(new Error(`Approval gate for task ${taskId} timed out after 5 minutes`))
    }, APPROVAL_TIMEOUT_MS)

    gates.set(taskId, (approved) => {
      clearTimeout(timer)
      resolve(approved)
    })
  })
}

export function resolveApproval(taskId: string, approved: boolean): void {
  const callback = gates.get(taskId)
  if (callback) {
    callback(approved)
    gates.delete(taskId)
  }
}
