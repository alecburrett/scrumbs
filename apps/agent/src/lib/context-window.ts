import Anthropic from '@anthropic-ai/sdk'

const CONTEXT_THRESHOLD = 120_000

export function estimateTokens(messages: Anthropic.MessageParam[]): number {
  return Math.ceil(JSON.stringify(messages).length / 4)
}

export async function maybeSummariseHistory(
  messages: Anthropic.MessageParam[],
  threshold = CONTEXT_THRESHOLD
): Promise<{ messages: Anthropic.MessageParam[]; summarised: boolean }> {
  if (estimateTokens(messages) <= threshold) {
    return { messages, summarised: false }
  }

  // Keep last 3 turns verbatim
  const keepCount = Math.min(6, messages.length) // 3 turns = up to 6 messages
  const toSummarise = messages.slice(0, messages.length - keepCount)
  const toKeep = messages.slice(messages.length - keepCount)

  if (toSummarise.length === 0) {
    return { messages, summarised: false }
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const summaryResponse = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Summarise this conversation history concisely, preserving:\n- Files created or modified (with paths)\n- Test results (pass/fail)\n- Story progress (which stories started, completed, blocked)\n- Pending decisions or open questions\n\n${JSON.stringify(toSummarise)}`,
      },
    ],
  })

  const summaryText =
    summaryResponse.content[0]?.type === 'text'
      ? summaryResponse.content[0].text
      : ''

  const summaryMessage: Anthropic.MessageParam = {
    role: 'assistant',
    content: `[Previous conversation summary]\n${summaryText}`,
  }

  // Ensure alternating roles after summary
  if (toKeep.length > 0 && toKeep[0].role === 'assistant') {
    return {
      messages: [
        summaryMessage,
        { role: 'user', content: 'Continue from where we left off.' },
        ...toKeep,
      ],
      summarised: true,
    }
  }

  return { messages: [summaryMessage, ...toKeep], summarised: true }
}
