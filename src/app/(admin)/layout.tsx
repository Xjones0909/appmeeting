import AppShell from '@/components/layout/AppShell'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user      = session.user as any
  const firstName = user.firstName as string | undefined
  const lastName  = user.lastName  as string | undefined
  const userName  = (firstName && lastName)
    ? `${firstName} ${lastName}`
    : (session.user.name ?? 'Utilisateur')
  const role      = (user.role      as string) ?? 'admin'
  const roleLabel = (user.roleLabel as string) ?? role

  return (
    <AppShell userName={userName} role={role} roleLabel={roleLabel}>
      {children}
    </AppShell>
  )
}
