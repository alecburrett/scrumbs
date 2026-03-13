'use client'

import { useState } from 'react'
import type { StoryStatus } from '@scrumbs/types'

interface Story {
  id: string
  title: string
  status: StoryStatus
}

interface KanbanStripProps {
  initialStories: Story[]
}

export function KanbanStrip({ initialStories }: KanbanStripProps) {
  const [stories, setStories] = useState(initialStories)

  const columns: { key: StoryStatus; label: string }[] = [
    { key: 'todo', label: 'To Do' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'done', label: 'Done' },
  ]

  return (
    <div className="flex gap-4 h-full">
      {columns.map((col) => (
        <div key={col.key} className="flex-1 flex flex-col">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
            {col.label}
            <span className="ml-2 text-slate-600">
              ({stories.filter((s) => s.status === col.key).length})
            </span>
          </div>
          <div className="flex-1 space-y-2">
            {stories
              .filter((s) => s.status === col.key)
              .map((story) => (
                <div
                  key={story.id}
                  className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200"
                >
                  {story.title}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
