import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
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
  const role      = user.role      as string ?? 'admin'
  const roleLabel = user.roleLabel as string ?? role

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={role} />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar userName={userName} role={roleLabel} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
