import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function SprintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/')

  return <div className="flex flex-col h-full">{children}</div>
}
