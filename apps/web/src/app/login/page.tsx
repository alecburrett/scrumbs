export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { SignInButton } from '@/components/auth/SignInButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await auth()
  if (session) redirect('/dashboard')

  const { error } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Scrumbs</h1>
        <p className="text-muted-foreground">Your AI scrum team, ready to ship.</p>
        {error && (
          <p className="text-sm text-destructive">Authentication failed. Please try again.</p>
        )}
        <SignInButton />
      </div>
    </main>
  )
}
