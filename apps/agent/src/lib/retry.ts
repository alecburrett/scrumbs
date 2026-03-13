const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 529])
const MAX_BACKOFF_MS = 30_000

function isRetryableError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: unknown }).status
    return typeof status === 'number' && RETRYABLE_STATUS_CODES.has(status)
  }
  return false
}

function backoffMs(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt - 1), MAX_BACKOFF_MS)
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  onRetry?: (attempt: number, err: unknown) => void
): Promise<T> {
  let lastErr: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err

      if (!isRetryableError(err) || attempt === maxAttempts) {
        throw err
      }

      onRetry?.(attempt, err)
      await new Promise((r) => setTimeout(r, backoffMs(attempt)))
    }
  }

  throw lastErr
}
