import { auth, signIn } from '@/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <div className="text-center space-y-8 max-w-lg px-4">
        <h1 className="text-5xl font-bold tracking-tight">Scrumbs</h1>
        <p className="text-xl text-slate-400">
          Your AI scrum team. Pablo writes the PRD. Stella runs the ceremonies.
          Viktor ships the code.
        </p>
        <form
          action={async () => {
            'use server'
            await signIn('github', { redirectTo: '/dashboard' })
          }}
        >
          <button
            type="submit"
            className="px-8 py-3 bg-white text-slate-950 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
          >
            Continue with GitHub
          </button>
        </form>
      </div>
    </main>
  )
}
