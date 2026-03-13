const gates = new Map<string, (approved: boolean) => void>()

export function waitForApproval(taskId: string): Promise<boolean> {
  return new Promise((resolve) => {
    gates.set(taskId, resolve)
  })
}

export function resolveApproval(taskId: string, approved: boolean): void {
  const resolve = gates.get(taskId)
  if (resolve) {
    resolve(approved)
    gates.delete(taskId)
  }
}
