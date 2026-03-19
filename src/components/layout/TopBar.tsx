'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Search, ChevronDown, LogOut, Settings, Menu } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

export default function TopBar({
  userName = 'Utilisateur',
  role = 'Utilisateur',
  onMenuClick,
}: {
  userName?: string
  role?: string
  onMenuClick?: () => void
}) {
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      {/* Gauche : hamburger (mobile) + recherche (desktop) */}
      <div className="flex items-center gap-3">
        {/* Bouton menu hamburger — visible uniquement sur mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Barre de recherche — cachée sur mobile */}
        <div className="relative w-72 hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une salle, une réservation..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 placeholder:text-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Droite : notifications + profil */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Dropdown utilisateur */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-semibold text-slate-800 leading-tight">{userName}</div>
              <div className="text-xs text-slate-400">{role}</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-slate-100 py-1.5 z-50 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="text-sm font-semibold text-slate-800">{userName}</div>
                <div className="text-xs text-slate-400">{role}</div>
              </div>
              <div className="py-1">
                <Link href="/settings" onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  <Settings className="w-4 h-4 text-slate-400" />
                  Paramètres
                </Link>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <button onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
