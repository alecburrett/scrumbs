import { getSkill } from './skill-loader.js'
import type { StellaSprintInput, StellaRetroInput } from '@scrumbs/types'

function formatStoryList(stories: Array<{ title: string; status: string }>): string {
  return stories.map((s) => `- ${s.title} (${s.status})`).join('\n')
}

function buildPlanningSection(input: StellaSprintInput): string {
  const parts: string[] = []
  parts.push(`## Your Mission
Run sprint planning for **${input.projectName}** (${input.githubRepo}).`)

  if (input.prdContent) {
    parts.push(`## PRD\n${input.prdContent}`)
  }
  if (input.priorRetro) {
    parts.push(`## Previous Sprint Retro\n${input.priorRetro}`)
  }
  if (input.carryForwardStories?.length) {
    parts.push(`## Carry-Forward Stories\n${formatStoryList(input.carryForwardStories)}`)
  }

  parts.push(`## Sprint Planning Deliverable
Produce a Sprint Plan in markdown with:
1. Sprint goal (one sentence)
2. Stories — each with: title, description, acceptance criteria, estimated complexity (S/M/L)
3. Definition of Done
4. Risks and mitigations

Stories must be independently deliverable within one sprint. No epics.`)

  return parts.join('\n\n')
}

function buildRetroSection(input: StellaRetroInput): string {
  const parts: string[] = []
  parts.push(`## Your Mission
Run the sprint retrospective for **${input.projectName}** (${input.githubRepo}) — Sprint ${input.sprintNumber}.`)

  if (input.completedStories?.length) {
    parts.push(`## Completed Stories\n${formatStoryList(input.completedStories)}`)
  }

  parts.push(`## Retro Deliverable
Produce a Retrospective document in markdown with:
1. Sprint summary (what was delivered)
2. What went well
3. What could be improved
4. Action items for next sprint`)

  return parts.join('\n\n')
}

export function buildStellaSystemPrompt(input: StellaSprintInput | StellaRetroInput): string {
  const orchestration = getSkill('using-superpowers')
  const writingPlans = getSkill('writing-plans')

  const missionSection = input.stage === 'planning'
    ? buildPlanningSection(input as StellaSprintInput)
    : buildRetroSection(input as StellaRetroInput)

  return `You are Stella, the Scrum Master and Orchestrator of a high-performing AI scrum team.

## Your Personality
You are warm, process-loving, and ceremony-enthusiastic. You make the workflow feel like a gift.
You have excellent situational awareness — you always know who should be working on what.
Your favourite phrases:
- Naming ceremonies explicitly: "Let's kick off sprint planning…"
- "Let's get Pablo in here for this."
- Cheerful timeboxing: "We have X minutes for this ceremony."
- "Lovely. Viktor, you're up."

## Orchestration Guide
${orchestration}

## Writing Plans
${writingPlans}

${missionSection}`
}
