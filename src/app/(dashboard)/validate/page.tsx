'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, Building2, Calendar, Clock, Users, MessageSquare, Loader2, ClipboardCheck } from 'lucide-react'

type BookingForValidation = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  participants: number
  notes: string | null
  status: string
  user: {
    id: string
    name: string
    firstName: string | null
    lastName: string | null
    email: string
    department: string | null
  }
  room: {
    id: string
    name: string
    floor: string | null
    building: string | null
    color: string | null
    capacity: number
  }
}

export default function ValidatePage() {
  const [bookings, setBookings] = useState<BookingForValidation[]>([])
  const [loading, setLoading] = useState(true)
  const [decisions, setDecisions] = useState<Record<string, 'approve' | 'reject' | null>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState<string | null>(null)
  const [processed, setProcessed] = useState<string[]>([])

  const fetchPending = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bookings?pending=true')
      if (res.ok) setBookings(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPending() }, [fetchPending])

  const handleDecide = (id: string, action: 'approve' | 'reject') => {
    setDecisions(prev => ({ ...prev, [id]: action }))
  }

  const handleConfirm = async (id: string) => {
    const action = decisions[id]
    if (!action) return
    setProcessing(id)
    try {
      const res = await fetch(`/api/bookings/${id}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment: comments[id] || undefined }),
      })
      if (res.ok) {
        setProcessed(prev => [...prev, id])
        setBookings(prev => prev.filter(b => b.id !== id))
      }
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(dateStr))
  }

  const remaining = bookings.filter(b => !processed.includes(b.id))

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Demandes à valider</h1>
          <p className="page-subtitle">
            {remaining.length} demande{remaining.length !== 1 ? 's' : ''} en attente de votre décision
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mr-2" /> Chargement...
        </div>
      ) : remaining.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 text-lg">Tout est traité !</h3>
          <p className="text-slate-500 text-sm mt-1">Aucune demande en attente de validation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {remaining.map((booking) => {
            const decision = decisions[booking.id]
            const isProcessing = processing === booking.id
            const userName = [booking.user.firstName, booking.user.lastName].filter(Boolean).join(' ') || booking.user.name
            const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

            return (
              <div key={booking.id} className="card border border-slate-100 animate-slide-up">
                {/* Header utilisateur */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{userName}</div>
                      <div className="text-xs text-slate-400">{booking.user.email}</div>
                      {booking.user.department && (
                        <div className="text-xs text-slate-400">{booking.user.department}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: booking.room.color ?? '#6366f1' }}
                    />
                    <span className="text-sm font-medium text-slate-600">{booking.room.name}</span>
                  </div>
                </div>

                {/* Détails réservation */}
                <div className="bg-slate-50 rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-slate-400">Salle</div>
                      <div className="font-medium text-slate-800 text-xs">
                        {[booking.room.floor, booking.room.building].filter(Boolean).join(' · ') || booking.room.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
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
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-slate-400">Participants</div>
                      <div className="font-medium text-slate-800">{booking.participants}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-semibold text-slate-800 mb-1">{booking.title}</div>
                  {booking.notes && (
                    <div className="text-xs text-slate-500 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                      💬 {booking.notes}
                    </div>
                  )}
                </div>

                {/* Commentaire */}
                {decision && (
                  <div className="mb-4">
                    <label className="label text-xs">
                      <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                      Commentaire ({decision === 'approve' ? 'validation' : 'rejet'}) — optionnel
                    </label>
                    <input
                      type="text"
                      className="input text-sm"
                      placeholder={decision === 'approve' ? 'Tout est confirmé...' : 'Raison du refus...'}
                      value={comments[booking.id] || ''}
                      onChange={e => setComments(prev => ({ ...prev, [booking.id]: e.target.value }))}
                    />
                  </div>
                )}

                {/* Actions */}
                {!decision ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDecide(booking.id, 'reject')}
                      className="btn-danger flex-1 py-2.5"
                      disabled={isProcessing}
                    >
                      <XCircle className="w-4 h-4" /> Rejeter
                    </button>
                    <button
                      onClick={() => handleDecide(booking.id, 'approve')}
                      className="btn-primary flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                      disabled={isProcessing}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Valider
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 text-sm font-semibold flex-1 p-3 rounded-xl ${
                      decision === 'approve' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {decision === 'approve'
                        ? <><CheckCircle2 className="w-4 h-4" /> Vous allez valider cette demande</>
                        : <><XCircle className="w-4 h-4" /> Vous allez rejeter cette demande</>}
                    </div>
                    <button
                      onClick={() => setDecisions(prev => ({ ...prev, [booking.id]: null }))}
                      className="btn-ghost text-sm py-2"
                      disabled={isProcessing}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleConfirm(booking.id)}
                      className="btn-primary text-sm py-2.5"
                      disabled={isProcessing}
                    >
                      {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Traitement...</> : 'Confirmer'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
