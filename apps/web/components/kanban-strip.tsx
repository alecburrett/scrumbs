'use client'

import { useState } from 'react'
import type { StoryStatus } from '@scrumbs/types'

interface Story {
  id: string
  title: string
  status: StoryStatus
  points?: number
}

interface KanbanStripProps {
  initialStories: Story[]
}

export function KanbanStrip({ initialStories }: KanbanStripProps) {
  const [stories, setStories] = useState(initialStories)

  const columns: { key: StoryStatus; label: string }[] = [
    { key: 'todo', label: 'To Do' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'done', label: 'Done' },
  ]

  const pointsFor = (status: StoryStatus) =>
    stories.filter((s) => s.status === status).reduce((sum, s) => sum + (s.points ?? 0), 0)

  return (
    <div className="flex gap-4 h-full">
      {columns.map((col) => (
        <div key={col.key} className="flex-1 flex flex-col">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
            {col.label}
            <span className="ml-2 text-slate-600">
              ({stories.filter((s) => s.status === col.key).length})
            </span>
            {pointsFor(col.key) > 0 && (
              <span className="ml-1 text-slate-500">{pointsFor(col.key)}pts</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            {stories
              .filter((s) => s.status === col.key)
              .map((story) => (
                <div
                  key={story.id}
                  className={`p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 transition-all duration-500 ${
                    story.status === 'done' ? 'border-green-700/50 bg-green-950/20 animate-in fade-in slide-in-from-left-2' : ''
                  }`}
                >
                  <span>{story.title}</span>
                  {story.points != null && (
                    <span className="ml-2 text-xs text-slate-500">{story.points}pts</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
