'use client'

import { useState } from 'react'
import type { PersonaName } from '@scrumbs/types'
import { PERSONA_DISPLAY_NAMES } from '@/lib/persona-constants'

export interface IntakeField {
  key: string
  label: string
  placeholder: string
  required: boolean
  multiline?: boolean
}

interface IntakeFormProps {
  personaName: PersonaName
  stage: string
  fields: IntakeField[]
  /** Pre-filled values (e.g. project name from DB) */
  prefilled?: Record<string, string>
  onSubmit: (values: Record<string, string>) => void
}

export function IntakeForm({
  personaName,
  stage,
  fields,
  prefilled = {},
  onSubmit,
}: IntakeFormProps) {
  const [values, setValues] = useState<Record<string, string>>(prefilled)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const name = PERSONA_DISPLAY_NAMES[personaName].toLowerCase()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const missing: Record<string, boolean> = {}
    for (const field of fields) {
      if (field.required && !values[field.key]?.trim()) {
        missing[field.key] = true
      }
    }
    if (Object.keys(missing).length > 0) {
      setErrors(missing)
      return
    }
    onSubmit(values)
  }

  return (
    <div className="flex items-center justify-center h-full bg-terminal-bg">
      <div className="w-full max-w-lg border border-terminal-border bg-terminal-surface">
        {/* Header */}
        <div className="px-5 py-3 border-b border-terminal-border flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-terminal-accent rounded-none" />
          <span className="text-xs font-mono uppercase tracking-widest text-terminal-muted">
            {name}@{stage}
          </span>
          <span className="ml-auto text-xs font-mono text-terminal-dim">
            intake required
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs font-mono text-terminal-muted leading-relaxed">
            Before {name} begins, answer a few questions so the output is accurate from the start.
            Required fields are marked <span className="text-terminal-accent">*</span>
          </p>

          {fields.map((field) => (
            <div key={field.key} className="space-y-1">
              <label className="block text-xs font-mono uppercase tracking-wider text-terminal-muted">
                {field.label}
                {field.required && (
                  <span className="text-terminal-accent ml-1">*</span>
                )}
              </label>
              {field.multiline ? (
                <textarea
                  value={values[field.key] ?? ''}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    setErrors((er) => ({ ...er, [field.key]: false }))
                  }}
                  placeholder={field.placeholder}
                  rows={3}
                  className={`terminal-input w-full resize-none ${errors[field.key] ? 'border-terminal-error' : ''}`}
                />
              ) : (
                <input
                  type="text"
                  value={values[field.key] ?? ''}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    setErrors((er) => ({ ...er, [field.key]: false }))
                  }}
                  placeholder={field.placeholder}
                  className={`terminal-input w-full ${errors[field.key] ? 'border-terminal-error' : ''}`}
                />
              )}
              {errors[field.key] && (
                <p className="text-xs font-mono text-terminal-error">required</p>
              )}
            </div>
          ))}

          <div className="pt-2 border-t border-terminal-border flex justify-end">
            <button type="submit" className="terminal-btn">
              start with {name} →
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Standard intake fields for the requirements stage */
export const REQUIREMENTS_INTAKE_FIELDS: IntakeField[] = [
  {
    key: 'projectDescription',
    label: 'What problem does it solve?',
    placeholder: 'e.g. Help solo devs run structured sprints without a team',
    required: true,
    multiline: true,
  },
  {
    key: 'targetUsers',
    label: 'Who are the target users?',
    placeholder: 'e.g. Indie hackers, freelancers, solo founders',
    required: true,
  },
  {
    key: 'domain',
    label: 'Domain / URL in mind?',
    placeholder: 'e.g. myapp.com or scrumbs.dev',
    required: false,
  },
  {
    key: 'techStack',
    label: 'Tech stack preferences?',
    placeholder: 'e.g. Next.js, Postgres, Railway — or leave blank',
    required: false,
  },
  {
    key: 'constraints',
    label: 'Key constraints (timeline, scale, budget)',
    placeholder: 'e.g. MVP in 2 weeks, solo dev, no paid infra yet',
    required: false,
  },
]

/** Standard intake fields for the PRD stage */
export const PRD_INTAKE_FIELDS: IntakeField[] = [
  {
    key: 'priorityFeatures',
    label: 'Must-have features for MVP?',
    placeholder: 'e.g. Auth, project creation, sprint planning, SSE streaming',
    required: true,
    multiline: true,
  },
  {
    key: 'outOfScope',
    label: 'Explicitly out of scope?',
    placeholder: 'e.g. Mobile app, team collaboration, billing in v1',
    required: false,
    multiline: true,
  },
  {
    key: 'successCriteria',
    label: 'How will you measure success?',
    placeholder: 'e.g. Can complete a full sprint end-to-end in < 30 min',
    required: false,
  },
]
