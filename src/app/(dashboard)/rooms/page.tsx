'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building2, Users, Video, Camera, Mic, Monitor, Loader2, Search, PlusCircle, Zap, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { QuickBookModal, getRoomStatus } from '@/components/modals/QuickBookModal'
import type { Room, DayBooking } from '@/components/modals/QuickBookModal'

const statusConfig = {
  'libre': { label: 'Libre', dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700' },
  'en-cours': { label: 'En cours', dot: 'bg-red-400 animate-pulse', badge: 'bg-red-100 text-red-600' },
  'complete': { label: 'Complète', dot: 'bg-orange-400', badge: 'bg-orange-100 text-orange-600' },
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [todayBookings, setTodayBookings] = useState<DayBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { fetchData() }, [fetchData])

  const activeRooms = rooms.filter(r => r.isActive)
  const filtered = activeRooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.location ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.floor ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.building ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Salles de réunion</h1>
          <p className="page-subtitle">{activeRooms.length} salle{activeRooms.length !== 1 ? 's' : ''} disponible{activeRooms.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/bookings/new" className="btn-primary">
          <PlusCircle className="w-4 h-4" /> Nouvelle réservation
        </Link>
      </div>

      {/* Légende + recherche */}
      <div className="card mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une salle..."
            className="input pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Libre</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> En cours</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> Complète</span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mr-2" /> Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{search ? 'Aucune salle trouvée' : 'Aucune salle disponible'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(room => {
            const status = getRoomStatus(room.id, todayBookings)
            const sc = statusConfig[status]
            const isOccupied = status !== 'libre'

            return (
              <div key={room.id} className={`card group transition-all duration-200 ${isOccupied ? 'opacity-90' : 'hover:shadow-card-hover cursor-pointer'}`}
                onClick={() => !isOccupied && setSelectedRoom(room)}
              >
                {/* Header coloré */}
                <div
                  className="h-24 rounded-xl mb-4 flex items-end justify-between p-3 relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${room.color ?? '#6366f1'}, ${room.color ?? '#6366f1'}99)` }}
                >
                  <Building2 className="w-8 h-8 text-white/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${sc.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                  {!isOccupied && (
                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Zap className="w-3 h-3" /> Réserver
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-slate-900 text-base">{room.name}</h3>
                  {room.requiresApproval && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0">
                      Validation
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  {[room.floor, room.building, room.location].filter(Boolean).join(' · ')}
                </p>

                {/* Capacité */}
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-sm text-slate-600">{room.capacity} personnes max.</span>
                </div>

                {/* Équipements */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { has: room.hasVideoConf, icon: Video, label: 'Visio' },
                    { has: room.hasCamera, icon: Camera, label: 'Caméra' },
                    { has: room.hasMicrophone, icon: Mic, label: 'Micro' },
                    { has: room.hasScreen, icon: Monitor, label: 'Écran' },
                  ].map(({ has, icon: Icon, label }) => has ? (
                    <span key={label} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      <Icon className="w-3 h-3" />{label}
                    </span>
                  ) : null)}
                </div>

                {/* Bouton réserver */}
                {!isOccupied && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedRoom(room) }}
                      className="w-full btn-primary py-2 text-sm"
                    >
                      <Zap className="w-3.5 h-3.5" /> Réserver maintenant
                    </button>
                  </div>
                )}
                {isOccupied && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {status === 'en-cours' ? 'Réservation en cours actuellement' : "Aucun créneau disponible aujourd'hui"}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

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
