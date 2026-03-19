'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PlusCircle, CalendarDays, Clock, Search, Loader2, Building2 } from 'lucide-react'

type Booking = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  participants: number
  status: string
  roomId: string
  notes: string | null
}

const statusMap: Record<string, { label: string; class: string }> = {
  CONFIRMED: { label: 'Confirmée', class: 'badge-confirmed' },
  PENDING: { label: 'En attente', class: 'badge-pending' },
  VALIDATED: { label: 'Validée', class: 'badge-validated' },
  REJECTED: { label: 'Rejetée', class: 'badge-rejected' },
  CANCELLED: { label: 'Annulée', class: 'badge-cancelled' },
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bookings?mine=true')
      if (res.ok) setBookings(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr))
  }

  const filtered = bookings.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.roomId.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || b.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Mes réservations</h1>
          <p className="page-subtitle">Historique de toutes vos réservations</p>
        </div>
        <Link href="/bookings/new" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Nouvelle réservation
        </Link>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="input pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input sm:w-44"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="CONFIRMED">Confirmée</option>
            <option value="PENDING">En attente</option>
            <option value="VALIDATED">Validée</option>
            <option value="REJECTED">Rejetée</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mr-2" /> Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{bookings.length === 0 ? "Aucune réservation pour l'instant" : 'Aucun résultat'}</p>
          {bookings.length === 0 && (
            <Link href="/bookings/new" className="btn-primary mt-4 inline-flex">
              Créer une réservation
            </Link>
          )}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  {['Réunion', 'Salle', 'Date & Heure', 'Participants', 'Statut'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((b) => {
                  const status = statusMap[b.status] ?? { label: b.status, class: 'badge-pending' }
                  return (
                    <tr
                      key={b.id}
                      onClick={() => router.push(`/bookings/${b.id}`)}
                      className="hover:bg-primary-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{b.title}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs">{b.roomId}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-700">{formatDate(b.date)}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />{b.startTime} – {b.endTime}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{b.participants}</td>
                      <td className="px-5 py-4">
                        <span className={status.class}>{status.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
