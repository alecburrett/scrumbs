'use client'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'

export function SignInButton() {
  return (
    <Button
      onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
      className="w-full gap-2"
      size="lg"
    >
      <Github className="h-5 w-5" />
      Continue with GitHub
    </Button>
  )
}
