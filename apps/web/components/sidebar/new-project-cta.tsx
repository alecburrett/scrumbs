import Link from 'next/link'

export function NewProjectCta() {
  return (
    <Link
      href="/projects/new"
      className="flex items-center gap-1 w-full px-2 py-1.5 text-xs font-mono text-terminal-muted border border-terminal-border hover:border-terminal-accent hover:text-terminal-accent transition-colors"
    >
      <span>+</span>
      <span>new project</span>
    </Link>
  )
}
