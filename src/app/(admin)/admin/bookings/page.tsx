'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Download, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

type BookingRecord = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  participants: number
  notes: string | null
  status: string
  createdAt: string
  user: { name: string; firstName: string | null; lastName: string | null; email: string; department: string | null }
  room: { name: string; floor: string | null; building: string | null; capacity: number; color: string | null }
}

type RoomOption = { id: string; name: string; floor: string | null; building: string | null }

const STATUS_LABELS: Record<string, string> = {
  PENDING:   'En attente',
  CONFIRMED: 'Confirmé',
  VALIDATED: 'Validé',
  REJECTED:  'Rejeté',
  CANCELLED: 'Annulé',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-50  text-blue-700  border-blue-200',
  VALIDATED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED:  'bg-red-50   text-red-600   border-red-200',
  CANCELLED: 'bg-slate-50 text-slate-500 border-slate-200',
}

function getDuration(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) return '—'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h00`
}

function getUserFullName(user: BookingRecord['user']) {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  return user.name
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getFirstDayOfMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export default function HistoryPage() {
  const [bookings, setBookings]       = useState<BookingRecord[]>([])
  const [rooms, setRooms]             = useState<RoomOption[]>([])
  const [loading, setLoading]         = useState(false)
  const [roomId, setRoomId]           = useState('')
  const [dateFrom, setDateFrom]       = useState(getFirstDayOfMonth)
  const [dateTo, setDateTo]           = useState(getToday)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]               = useState(1)
  const [total, setTotal]             = useState(0)
  const LIMIT = 20

  // Load rooms list
  useEffect(() => {
    fetch('/api/rooms')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRooms(data) })
      .catch(() => {})
  }, [])

  const fetchHistory = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(LIMIT) })
      if (roomId)       params.set('roomId',   roomId)
      if (dateFrom)     params.set('dateFrom', dateFrom)
      if (dateTo)       params.set('dateTo',   dateTo)
      if (statusFilter) params.set('status',   statusFilter)

      const res = await fetch(`/api/history?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings ?? [])
        setTotal(data.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [roomId, dateFrom, dateTo, statusFilter])

  useEffect(() => {
    setPage(1)
    fetchHistory(1)
  }, [fetchHistory])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchHistory(newPage)
  }

  // Export CSV (opens in Excel)
  const exportCSV = async () => {
    // Fetch all records for export (no pagination)
    const params = new URLSearchParams({ page: '1', limit: '10000' })
    if (roomId)       params.set('roomId',   roomId)
    if (dateFrom)     params.set('dateFrom', dateFrom)
    if (dateTo)       params.set('dateTo',   dateTo)
    if (statusFilter) params.set('status',   statusFilter)

    const res = await fetch(`/api/history?${params}`)
    if (!res.ok) return
    const { bookings: all } = await res.json()

    const headers = [
      'Salle', 'Bâtiment', 'Étage', 'Capacité',
      'Demandeur', 'Email', 'Département',
      'Titre', 'Date', 'Heure début', 'Heure fin', 'Durée', 'Participants',
      'Statut', 'Notes',
    ]
    const rows = (all as BookingRecord[]).map(b => [
      b.room.name,
      b.room.building ?? '',
      b.room.floor ?? '',
      String(b.room.capacity),
      getUserFullName(b.user),
      b.user.email,
      b.user.department ?? '',
      b.title,
      new Date(b.date).toLocaleDateString('fr-FR'),
      b.startTime,
      b.endTime,
      getDuration(b.startTime, b.endTime),
      String(b.participants),
      STATUS_LABELS[b.status] ?? b.status,
      b.notes ?? '',
    ])

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n')

    // BOM for Excel UTF-8 compatibility
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    const from = dateFrom ? `_${dateFrom}` : ''
    const to   = dateTo   ? `_au_${dateTo}` : ''
    a.download = `historique${from}${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Historique global</h1>
            <p className="text-sm text-slate-500">Toutes les réservations de salles</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          disabled={total === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Exporter Excel (.csv)
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Filtres</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Salle</label>
            <select
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            >
              <option value="">Toutes les salles</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}{r.building ? ` — ${r.building}` : ''}{r.floor ? ` (${r.floor})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Statut</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-700">
            {loading ? 'Chargement…' : `${total} réservation${total !== 1 ? 's' : ''}`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-xs text-slate-500 min-w-[60px] text-center">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-400">Aucune réservation pour cette période</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Salle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Demandeur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Titre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Horaire</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Durée</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pers.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 text-sm leading-tight">{b.room.name}</div>
                      {(b.room.building || b.room.floor) && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {[b.room.building, b.room.floor].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-sm leading-tight">{getUserFullName(b.user)}</div>
                      {b.user.department && (
                        <div className="text-xs text-slate-400 mt-0.5">{b.user.department}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="text-sm text-slate-700 truncate" title={b.title}>{b.title}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {new Date(b.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap font-mono tracking-tight">
                      {b.startTime}<span className="text-slate-300 mx-0.5">–</span>{b.endTime}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                      {getDuration(b.startTime, b.endTime)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-center">
                      {b.participants}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-medium ${STATUS_COLORS[b.status] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-400">
              Affichage {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} sur {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Précédent
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
              >
                Suivant <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
