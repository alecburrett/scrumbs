import Link from 'next/link'

export function NewProjectCta() {
  return (
    <Link
      href="/projects/new"
      className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
    >
      + New Project
    </Link>
  )
}
