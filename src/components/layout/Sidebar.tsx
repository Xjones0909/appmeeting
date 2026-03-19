'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Building2, LayoutDashboard, CalendarDays, Clock, PlusCircle,
  Settings, LogOut, Users, BookOpen, ChevronRight, ClipboardCheck,
  DoorOpen, X,
} from 'lucide-react'

const navItems = [
  { label: 'Tableau de bord',      href: '/dashboard',      icon: LayoutDashboard, roles: ['user', 'manager', 'admin'] },
  { label: 'Nouvelle réservation', href: '/bookings/new',   icon: PlusCircle,      roles: ['user', 'manager', 'admin'], highlight: true },
  { label: 'Mes réservations',     href: '/bookings',        icon: CalendarDays,    roles: ['user', 'manager', 'admin'] },
  { label: 'Voir les salles',      href: '/rooms',           icon: DoorOpen,        roles: ['user', 'manager', 'admin'] },
  { label: 'Demandes en attente',  href: '/pending',         icon: Clock,           roles: ['user', 'manager', 'admin'] },
  { label: 'Demande à valider',    href: '/validate',        icon: ClipboardCheck,  roles: ['manager', 'admin'], badgeDynamic: true },
  { label: 'Gestion des salles',   href: '/admin/rooms',     icon: Building2,       roles: ['admin'] },
  { label: 'Utilisateurs',         href: '/admin/users',     icon: Users,           roles: ['admin'] },
  { label: 'Historique global',    href: '/admin/bookings',  icon: BookOpen,        roles: ['admin', 'manager'] },
  { label: 'Paramètres app',       href: '/admin/settings',  icon: Settings,        roles: ['admin'] },
]

export default function Sidebar({
  role = 'user',
  pendingCount = 0,
  isOpen = false,
  onClose,
}: {
  role?: string
  pendingCount?: number
  isOpen?: boolean
  onClose?: () => void
}) {
  const pathname = usePathname()
  const visibleItems = navItems.filter(item => item.roles.includes(role))

  return (
    <aside
      className={`
        fixed left-0 top-0 z-30 h-screen w-64 flex-shrink-0
        bg-white border-r border-slate-100 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      {/* Logo + bouton fermer (mobile) */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm leading-tight">Bourcha</div>
            <div className="text-xs text-slate-400">Room Booking</div>
          </div>
        </div>
        {/* Bouton fermer uniquement sur mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          const badge = item.badgeDynamic && pendingCount > 0 ? pendingCount : null
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${item.highlight && !isActive
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                  : isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${
                item.highlight && !isActive ? 'text-white'
                : isActive ? 'text-primary-600'
                : 'text-slate-400 group-hover:text-slate-600'
              }`} />
              <span className="flex-1">{item.label}</span>
              {badge && (
                <span className="bg-violet-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {badge}
                </span>
              )}
              {isActive && !item.highlight && (
                <ChevronRight className="w-3.5 h-3.5 text-primary-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-100 space-y-0.5">
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          Paramètres
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
