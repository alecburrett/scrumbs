const APPROVAL_TIMEOUT_MS = 300_000 // 5 minutes

const gates = new Map<string, (approved: boolean) => void>()

export function waitForApproval(taskId: string): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      gates.delete(taskId)
      resolve(false)
    }, APPROVAL_TIMEOUT_MS)

    gates.set(taskId, (approved: boolean) => {
      clearTimeout(timeout)
      resolve(approved)
    })
  })
}

export function resolveApproval(taskId: string, approved: boolean): void {
  const resolve = gates.get(taskId)
  if (resolve) {
    resolve(approved)
    gates.delete(taskId)
  }
}
