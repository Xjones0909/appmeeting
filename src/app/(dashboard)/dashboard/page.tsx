'use client'

import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, CheckCircle2, PlusCircle, ArrowRight, Building2, Users, Zap, Loader2, Clock, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { QuickBookModal, getRoomStatus } from '@/components/modals/QuickBookModal'
import type { Room, DayBooking } from '@/components/modals/QuickBookModal'

const upcomingBookings = [
  { id: '1', room: "Salle Innovation", date: "Aujourd'hui", time: '14:00 - 15:30', participants: 8, status: 'CONFIRMED', color: 'bg-emerald-500' },
  { id: '2', room: 'Salle Exécutive', date: 'Demain', time: '09:00 - 10:00', participants: 4, status: 'PENDING', color: 'bg-amber-500' },
  { id: '3', room: 'Salle Atlas', date: '18 Mars', time: '11:00 - 12:00', participants: 12, status: 'VALIDATED', color: 'bg-blue-500' },
]

const statusMap = {
  CONFIRMED: { label: 'Confirmée', class: 'badge-confirmed' },
  PENDING: { label: 'En attente', class: 'badge-pending' },
  VALIDATED: { label: 'Validée', class: 'badge-validated' },
  REJECTED: { label: 'Rejetée', class: 'badge-rejected' },
  CANCELLED: { label: 'Annulée', class: 'badge-cancelled' },
} as Record<string, { label: string; class: string }>

export default function DashboardPage() {
  const { data: session } = useSession()
  const [rooms, setRooms] = useState<Room[]>([])
  const [todayBookings, setTodayBookings] = useState<DayBooking[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const fetchData = useCallback(async () => {
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch(`/api/bookings?date=${today}`),
      ])
      if (roomsRes.ok) setRooms(await roomsRes.json())
      if (bookingsRes.ok) setTodayBookings(await bookingsRes.json())
    } finally { setLoadingRooms(false) }
  }, [today])

  useEffect(() => { fetchData() }, [fetchData])

  const activeRooms = rooms.filter(r => r.isActive)
  const role = (session?.user as any)?.role ?? 'user'
  const firstName = ((session?.user as any)?.firstName) || (session?.user?.name ?? 'vous').split(' ')[0]
  const dateStr = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bonjour, {firstName} 👋</h1>
          <p className="text-slate-500 mt-0.5 text-sm">{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} · Voici votre tableau de bord</p>
        </div>
        <Link href="/bookings/new" className="btn-primary"><PlusCircle className="w-4 h-4" /> Nouvelle réservation</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900 text-base">Réservations à venir</h2>
            <Link href="/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => { const status = statusMap[booking.status]; return (
              <Link key={booking.id} href={`/bookings/${booking.id}`} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-primary-50/50 transition-colors">
                <div className={`w-1 h-12 rounded-full ${booking.color} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm truncate">{booking.room}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500">{booking.date}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{booking.time}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{booking.participants} pers.</span>
                  </div>
                </div>
                <span className={status.class}>{status.label}</span>
              </Link>
            )})}
          </div>
        </div>

        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-base">Salles maintenant</h2>
            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> En direct
            </span>
          </div>

          <div className="overflow-y-auto max-h-64 space-y-1 pr-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
            {loadingRooms ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement...
              </div>
            ) : activeRooms.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">Aucune salle configurée</div>
            ) : activeRooms.map((room) => {
              const roomStatus = getRoomStatus(room.id, todayBookings)
              const isOccupied = roomStatus !== 'libre'
              const roomBookingsCount = todayBookings.filter(b => b.roomId === room.id).length

              return (
                <button key={room.id}
                  onClick={() => !isOccupied && setSelectedRoom(room)}
                  disabled={isOccupied}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left border ${
                    isOccupied
                      ? 'bg-red-50/50 border-red-100 cursor-not-allowed'
                      : 'hover:bg-primary-50 border-transparent hover:border-primary-100 group cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      roomStatus === 'en-cours' ? 'bg-red-400 animate-pulse' :
                      roomStatus === 'complete' ? 'bg-orange-400' : 'bg-emerald-400'
                    }`} />
                    <div>
                      <div className={`text-sm font-medium transition-colors ${isOccupied ? 'text-slate-400' : 'text-slate-700 group-hover:text-primary-700'}`}>
                        {room.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {room.capacity} pers.
                        {room.hasVideoConf ? ' · 📹' : ''}
                        {room.hasScreen ? ' · 🖥' : ''}
                        {!isOccupied && roomBookingsCount > 0 ? ` · ${roomBookingsCount} rés. auj.` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {roomStatus === 'en-cours' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">En cours</span>
                    )}
                    {roomStatus === 'complete' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Complète</span>
                    )}
                    {roomStatus === 'libre' && (
                      <>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Libre</span>
                        <Zap className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-500 transition-colors" />
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-3 text-[11px] text-slate-400 justify-center">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Libre</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> En cours</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Complète</span>
            </div>
            <Link href="/bookings/new" className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2">
              <PlusCircle className="w-3.5 h-3.5" /> Réservation complète
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-bold text-slate-900 text-base mb-4">Accès rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Voir les salles', icon: Building2, href: '/rooms', color: 'text-primary-600 bg-primary-50', disabled: false },
            { label: 'Mes réservations', icon: CalendarDays, href: '/bookings', color: 'text-emerald-600 bg-emerald-50', disabled: false },
            { label: 'Demandes en attente', icon: Clock, href: '/pending', color: 'text-amber-600 bg-amber-50', disabled: false },
            {
              label: 'Demande à valider',
              icon: ClipboardCheck,
              href: '/validate',
              color: (role === 'manager' || role === 'admin') ? 'text-violet-600 bg-violet-50' : 'text-slate-300 bg-slate-50',
              disabled: !(role === 'manager' || role === 'admin'),
            },
          ].map((item) => { const Icon = item.icon; return (
            item.disabled ? (
              <div key={item.label} className="card flex flex-col items-center gap-3 text-center py-5 opacity-40 cursor-not-allowed select-none">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${item.color}`}><Icon className="w-5 h-5" /></div>
                <span className="text-sm font-medium text-slate-400">{item.label}</span>
              </div>
            ) : (
              <Link key={item.label} href={item.href} className="card-hover flex flex-col items-center gap-3 text-center py-5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${item.color}`}><Icon className="w-5 h-5" /></div>
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </Link>
            )
          )})}
        </div>
      </div>

      {selectedRoom && (
        <QuickBookModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onSuccess={() => { setSelectedRoom(null); fetchData() }}
        />
      )}
    </div>
  )
}
