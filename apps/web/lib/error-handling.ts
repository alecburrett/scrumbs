/**
 * Error handling utilities for the web app.
 * Handles GitHub 401 re-auth triggers and provides type-safe error helpers.
 */

export class GithubAuthExpiredError extends Error {
  constructor() {
    super('GitHub authentication has expired. Please sign in again.')
    this.name = 'GithubAuthExpiredError'
  }
}

export class AgentTaskError extends Error {
  constructor(
    message: string,
    public readonly taskId: string,
    public readonly errorCode?: string
  ) {
    super(message)
    this.name = 'AgentTaskError'
  }
}

/**
 * Returns true if the error from an agent task indicates GitHub auth expiry.
 * The agent service sets errorMessage to 'github_auth_expired' in this case.
 */
export function isGithubAuthExpired(errorMessage: string | null | undefined): boolean {
  return errorMessage === 'github_auth_expired'
}

/**
 * Map of agent service error codes to user-facing messages.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  github_auth_expired: 'Your GitHub session expired. Please sign in again to continue.',
  budget_exceeded: 'This task exceeded its token budget. Please start a new task.',
  concurrency_limit: 'Too many tasks running. Please wait for one to complete.',
  workspace_error: 'Failed to set up the development workspace.',
  unknown: 'An unexpected error occurred. Please try again.',
}

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.unknown
}
