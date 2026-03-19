'use client'

import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, Clock, Building2, Loader2, XCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Booking = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  participants: number
  notes: string | null
  status: string
  roomId: string
}

const statusMap: Record<string, { label: string; class: string }> = {
  CONFIRMED: { label: 'Confirmée', class: 'badge-confirmed' },
  PENDING: { label: 'En attente', class: 'badge-pending' },
  VALIDATED: { label: 'Validée', class: 'badge-validated' },
  REJECTED: { label: 'Rejetée', class: 'badge-rejected' },
  CANCELLED: { label: 'Annulée', class: 'badge-cancelled' },
}

export default function PendingPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const fetchPending = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bookings?mine=true&status=PENDING')
      if (res.ok) setBookings(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPending() }, [fetchPending])

  const handleCancel = async (id: string) => {
    setCancelling(id)
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'PATCH' })
      if (res.ok) setBookings(prev => prev.filter(b => b.id !== id))
    } finally {
      setCancelling(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(dateStr))
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Demandes en attente</h1>
          <p className="page-subtitle">Vos réservations en attente de validation</p>
        </div>
        <Link href="/bookings/new" className="btn-primary">
          Nouvelle réservation
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mr-2" /> Chargement...
        </div>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 text-lg">Aucune demande en attente</h3>
          <p className="text-slate-500 text-sm mt-1">Toutes vos réservations ont été traitées.</p>
          <Link href="/bookings" className="btn-secondary mt-4 inline-flex">Voir mes réservations</Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Ces réservations sont en attente de validation par un responsable.
              Vous serez notifié dès qu'une décision sera prise.
            </p>
          </div>

          {bookings.map((booking) => (
            <div key={booking.id} className="card border border-amber-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{booking.title}</h3>
                  <span className="badge-pending mt-1 inline-block">En attente de validation</span>
                </div>
                <button
                  onClick={() => handleCancel(booking.id)}
                  disabled={cancelling === booking.id}
                  className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {cancelling === booking.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <XCircle className="w-3.5 h-3.5" />}
                  Annuler
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Salle</div>
                    <div className="font-medium text-slate-800 text-xs">{booking.roomId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Date</div>
                    <div className="font-medium text-slate-800 text-xs capitalize">{formatDate(booking.date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Horaire</div>
                    <div className="font-medium text-slate-800 text-xs">{booking.startTime} – {booking.endTime}</div>
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-3 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  💬 {booking.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
