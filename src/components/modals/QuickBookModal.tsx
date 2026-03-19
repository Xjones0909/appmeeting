'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building2, Users, Zap, X, Loader2, Video, Camera, Mic, Monitor, CheckCircle2 } from 'lucide-react'

export type Room = {
  id: string; name: string; capacity: number; floor: string | null; location: string | null
  building: string | null; hasScreen: boolean; hasCamera: boolean; hasMicrophone: boolean
  hasVideoConf: boolean; hasProjector: boolean; requiresApproval: boolean; isActive: boolean; color: string | null
}

export type DayBooking = {
  id: string; startTime: string; endTime: string; title: string; roomId: string; status: string
}

const WORK_START = '08:00'
const WORK_END = '18:00'

function timeToMins(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function getCurrentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function TimelineBar({ bookings }: { bookings: DayBooking[] }) {
  const S = timeToMins(WORK_START)
  const E = timeToMins(WORK_END)
  const T = E - S
  const now = getCurrentTime()
  const nowMin = timeToMins(now)
  const nowPct = ((nowMin - S) / T) * 100
  return (
    <div className="select-none">
      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
        {['08h', '10h', '12h', '14h', '16h', '18h'].map(h => <span key={h}>{h}</span>)}
      </div>
      <div className="relative h-7 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
        {bookings.map(b => {
          const startMin = Math.max(0, timeToMins(b.startTime) - S)
          const endMin = Math.min(T, timeToMins(b.endTime) - S)
          if (endMin <= 0 || startMin >= T) return null
          const left = (startMin / T) * 100
          const width = ((endMin - startMin) / T) * 100
          return (
            <div key={b.id}
              className="absolute top-0 h-full bg-red-400/80 flex items-center justify-center overflow-hidden"
              style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
              title={`${b.startTime} – ${b.endTime}: ${b.title}`}
            >
              {width > 10 && <span className="text-white text-[9px] font-semibold truncate px-1 leading-none">{b.startTime}–{b.endTime}</span>}
            </div>
          )
        })}
        {nowMin >= S && nowMin <= E && (
          <div className="absolute top-0 h-full w-0.5 bg-blue-500 z-10" style={{ left: `${nowPct}%` }}>
            <div className="absolute -top-0.5 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400/80 rounded-sm inline-block" /> Occupée</span>
        <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-blue-500 inline-block" /> Maintenant</span>
      </div>
    </div>
  )
}

export function getRoomStatus(roomId: string, bookings: DayBooking[]): 'libre' | 'en-cours' | 'complete' {
  const rb = bookings.filter(b => b.roomId === roomId)
  if (rb.length === 0) return 'libre'
  const now = getCurrentTime()
  if (rb.some(b => b.startTime <= now && b.endTime > now)) return 'en-cours'
  const intervals = rb.map(b => ({ s: timeToMins(b.startTime), e: timeToMins(b.endTime) })).sort((a, b) => a.s - b.s)
  let covered = timeToMins(WORK_START)
  for (const iv of intervals) {
    if (iv.s <= covered) covered = Math.max(covered, iv.e)
    else break
  }
  if (covered >= timeToMins(WORK_END)) return 'complete'
  return 'libre'
}

export function QuickBookModal({ room, onClose, onSuccess }: { room: Room; onClose: () => void; onSuccess: () => void }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    title: 'Réunion - ' + room.name,
    date: today, startTime: '', endTime: '', participants: '', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [dayBookings, setDayBookings] = useState<DayBooking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const sf = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const fetchBookings = useCallback(async (date: string) => {
    setLoadingBookings(true)
    try {
      const res = await fetch(`/api/bookings?roomId=${room.id}&date=${date}`)
      if (res.ok) setDayBookings(await res.json())
      else setDayBookings([])
    } catch { setDayBookings([]) }
    finally { setLoadingBookings(false) }
  }, [room.id])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchBookings(today) }, [])

  const handleDateChange = (v: string) => {
    setForm(p => ({ ...p, date: v, startTime: '', endTime: '' }))
    fetchBookings(v)
  }

  const handleSubmit = async () => {
    if (!form.title || !form.date || !form.startTime || !form.endTime) {
      setError('Veuillez remplir tous les champs obligatoires.'); return
    }
    if (form.startTime >= form.endTime) {
      setError("L'heure de fin doit être après l'heure de début."); return
    }
    if (form.startTime < WORK_START || form.endTime > WORK_END) {
      setError(`Réservations uniquement de ${WORK_START} à ${WORK_END}.`); return
    }
    const conflict = dayBookings.find(b => b.startTime < form.endTime && b.endTime > form.startTime)
    if (conflict) {
      setError(`Créneau déjà occupé : ${conflict.startTime} – ${conflict.endTime}.`); return
    }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id, title: form.title, date: form.date,
          startTime: form.startTime, endTime: form.endTime,
          participants: form.participants ? Number(form.participants) : 1,
          notes: form.notes
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur inconnue'); return }
      setDone(true)
      setTimeout(() => { onSuccess(); onClose() }, 2000)
    } catch { setError('Erreur de connexion') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="p-5 text-white relative flex-shrink-0" style={{ background: `linear-gradient(135deg, ${room.color ?? '#6366f1'}, ${room.color ?? '#6366f1'}bb)` }}>
          <button className="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5" /></div>
            <div>
              <h2 className="font-bold text-lg leading-tight">{room.name}</h2>
              <p className="text-white/80 text-xs">{[room.floor, room.building].filter(Boolean).join(' · ')} · {room.capacity} pers. max</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap mt-2">
            {room.hasVideoConf && <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full"><Video className="w-3 h-3" /> Visio</span>}
            {room.hasCamera && <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full"><Camera className="w-3 h-3" /> Caméra</span>}
            {room.hasMicrophone && <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full"><Mic className="w-3 h-3" /> Micro</span>}
            {room.hasScreen && <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full"><Monitor className="w-3 h-3" /> Écran</span>}
            {room.requiresApproval && <span className="inline-flex items-center gap-1 text-xs bg-amber-400/40 px-2 py-0.5 rounded-full">⚠ Validation requise</span>}
          </div>
        </div>
        {done ? (
          <div className="p-8 text-center flex-shrink-0">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">Réservation envoyée !</h3>
            <p className="text-slate-500 text-sm">{room.requiresApproval ? 'En attente de validation manager.' : 'Votre salle est confirmée.'}</p>
          </div>
        ) : (
          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Planning du {form.date === today ? 'jour' : form.date}
                </p>
                {loadingBookings && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
              </div>
              {!loadingBookings && dayBookings.length === 0 ? (
                <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> Aucune réservation — salle entièrement libre ce jour
                </div>
              ) : !loadingBookings ? (
                <div className="space-y-2">
                  <TimelineBar bookings={dayBookings} />
                  <div className="space-y-1 mt-2">
                    {dayBookings.map(b => (
                      <div key={b.id} className="flex items-center gap-2 text-xs bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="font-bold text-slate-700 tabular-nums">{b.startTime} – {b.endTime}</span>
                        <span className="text-slate-400 truncate">· {b.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-8 bg-slate-200 rounded-lg animate-pulse" />
              )}
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-3">
              {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">{error}</div>}
              <div>
                <label className="label">Titre de la réunion *</label>
                <input className="input" value={form.title} onChange={e => sf('title', e.target.value)} />
              </div>
              <div>
                <label className="label">Date *</label>
                <input className="input" type="date" min={today} value={form.date} onChange={e => handleDateChange(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Heure début * <span className="text-slate-400 font-normal text-[11px]">(08h–18h)</span></label>
                  <input className="input" type="time" min={WORK_START} max={WORK_END} step="900"
                    value={form.startTime} onChange={e => sf('startTime', e.target.value)} />
                </div>
                <div>
                  <label className="label">Heure fin *</label>
                  <input className="input" type="time" min={form.startTime || WORK_START} max={WORK_END} step="900"
                    value={form.endTime} onChange={e => sf('endTime', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Participants</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input className="input pl-9" type="number" min="1" max={room.capacity}
                    placeholder={`1 à ${room.capacity}`} value={form.participants}
                    onChange={e => sf('participants', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Remarques (optionnel)</label>
                <textarea className="input resize-none h-16 text-sm" placeholder="Informations supplémentaires..."
                  value={form.notes} onChange={e => sf('notes', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Annuler</button>
              <button className="btn-primary flex-1" onClick={handleSubmit} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</> : <><Zap className="w-4 h-4" /> Réserver</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
