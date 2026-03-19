'use client'

import { useState } from 'react'
import {
  Users, Calendar, Clock, Video, Camera, Mic, Monitor,
  Search, ArrowRight, ArrowLeft, CheckCircle2, Building2,
  Wifi, Star, ChevronDown, Loader2
} from 'lucide-react'

const rooms = [
  {
    id: '1',
    name: 'Salle Innovation',
    capacity: 10,
    floor: '2ème étage',
    hasScreen: true, hasCamera: true, hasMicrophone: true, hasVideoConf: true,
    requiresApproval: false,
    available: true,
    score: 100,
    image: null,
    color: 'from-violet-500 to-primary-600',
  },
  {
    id: '2',
    name: 'Salle Exécutive',
    capacity: 8,
    floor: '3ème étage',
    hasScreen: true, hasCamera: true, hasMicrophone: true, hasVideoConf: true,
    requiresApproval: true,
    available: true,
    score: 95,
    image: null,
    color: 'from-primary-500 to-cyan-500',
  },
  {
    id: '3',
    name: 'Salle Atlas',
    capacity: 20,
    floor: '1er étage',
    hasScreen: true, hasCamera: false, hasMicrophone: true, hasVideoConf: false,
    requiresApproval: false,
    available: true,
    score: 75,
    image: null,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: '4',
    name: 'Salle Focus',
    capacity: 4,
    floor: '2ème étage',
    hasScreen: false, hasCamera: false, hasMicrophone: false, hasVideoConf: false,
    requiresApproval: false,
    available: false,
    score: 40,
    image: null,
    color: 'from-orange-400 to-rose-500',
  },
]

export default function NewBookingPage() {
  const [step, setStep] = useState(1) // 1=besoin, 2=résultats, 3=confirmation
  const [form, setForm] = useState({
    participants: '',
    date: '',
    startTime: '',
    endTime: '',
    isFullDay: false,
    needsVideo: false,
    needsCamera: false,
    needsMic: false,
    needsScreen: false,
    title: '',
    notes: '',
  })
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [booked, setBooked] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    await new Promise(r => setTimeout(r, 1000))
    setIsSearching(false)
    setStep(2)
  }

  const handleBook = async () => {
    setIsBooking(true)
    await new Promise(r => setTimeout(r, 1500))
    setIsBooking(false)
    setBooked(true)
  }

  const matchingRooms = rooms.filter(r => {
    if (!r.available) return false
    if (form.needsVideo && !r.hasVideoConf) return false
    if (form.needsCamera && !r.hasCamera) return false
    if (form.needsMic && !r.hasMicrophone) return false
    if (form.needsScreen && !r.hasScreen) return false
    if (form.participants && r.capacity < parseInt(form.participants)) return false
    return true
  })

  const otherRooms = rooms.filter(r => r.available && !matchingRooms.includes(r))
  const selectedRoomData = rooms.find(r => r.id === selectedRoom)

  if (booked) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Réservation confirmée !</h2>
        <p className="text-slate-500 mb-2">
          {selectedRoomData?.requiresApproval
            ? 'Votre demande est en attente de validation. Vous recevrez un email dès qu\'elle sera traitée.'
            : 'Votre salle est réservée. Un email de confirmation vous a été envoyé.'}
        </p>
        <div className="card mt-8 text-left">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Salle</span>
              <span className="font-semibold text-slate-900">{selectedRoomData?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date</span>
              <span className="font-semibold text-slate-900">{form.date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Horaire</span>
              <span className="font-semibold text-slate-900">{form.startTime} - {form.endTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Statut</span>
              <span className={selectedRoomData?.requiresApproval ? 'badge-pending' : 'badge-confirmed'}>
                {selectedRoomData?.requiresApproval ? 'En attente' : 'Confirmée'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-center">
          <button onClick={() => { setStep(1); setBooked(false); setSelectedRoom(null) }} className="btn-secondary">
            Nouvelle réservation
          </button>
          <a href="/bookings" className="btn-primary">
            Mes réservations <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3 mb-1">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="btn-ghost py-1.5 px-2.5">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h1 className="page-title">
            {step === 1 && 'Nouvelle réservation'}
            {step === 2 && 'Salles disponibles'}
            {step === 3 && 'Confirmation'}
          </h1>
        </div>
        {/* Stepper */}
        <div className="flex items-center gap-2 mt-4">
          {['Vos besoins', 'Choisir une salle', 'Confirmer'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${i + 1 <= step ? 'text-primary-600' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${i + 1 < step ? 'bg-primary-600 border-primary-600 text-white'
                    : i + 1 === step ? 'border-primary-600 text-primary-600'
                    : 'border-slate-200 text-slate-400'}`}>
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 w-8 rounded ${i + 1 < step ? 'bg-primary-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1 - Besoin */}
      {step === 1 && (
        <form onSubmit={handleSearch} className="card animate-slide-up">
          <h2 className="font-bold text-slate-900 mb-6">Décrivez votre besoin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">Titre de la réunion *</label>
              <input type="text" className="input" placeholder="Ex: Réunion projet Atlas" value={form.title}
                onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
            <div>
              <label className="label">Nombre de participants *</label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" min="1" className="input pl-10" placeholder="Ex: 8" value={form.participants}
                  onChange={e => setForm({...form, participants: e.target.value})} required />
              </div>
            </div>
            <div>
              <label className="label">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="date" className="input pl-10" value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})} required />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="fullday" className="w-4 h-4 rounded border-slate-300 text-primary-600"
                checked={form.isFullDay} onChange={e => setForm({...form, isFullDay: e.target.checked})} />
              <label htmlFor="fullday" className="text-sm font-medium text-slate-700">Journée complète</label>
            </div>
            {!form.isFullDay && (
              <>
                <div>
                  <label className="label">Heure de début *</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="time" className="input pl-10" value={form.startTime}
                      onChange={e => setForm({...form, startTime: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="label">Heure de fin *</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="time" className="input pl-10" value={form.endTime}
                      onChange={e => setForm({...form, endTime: e.target.value})} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Équipements */}
          <div className="mt-6">
            <label className="label mb-3">Équipements nécessaires</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'needsVideo', icon: Video, label: 'Visioconférence' },
                { key: 'needsCamera', icon: Camera, label: 'Caméra' },
                { key: 'needsMic', icon: Mic, label: 'Microphones' },
                { key: 'needsScreen', icon: Monitor, label: 'Écran / Préso' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({...form, [key]: !form[key as keyof typeof form]})}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium
                    ${form[key as keyof typeof form]
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="label">Remarques (optionnel)</label>
            <textarea className="input resize-none h-20" placeholder="Informations supplémentaires..."
              value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={isSearching} className="btn-primary px-8 py-3">
              {isSearching ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Recherche...</>
              ) : (
                <><Search className="w-4 h-4" /> Voir les salles disponibles</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2 - Résultats */}
      {step === 2 && (
        <div className="space-y-6 animate-slide-up">
          {matchingRooms.length === 0 && otherRooms.length === 0 ? (
            <div className="card text-center py-12">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 text-lg mb-2">Aucune salle disponible</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Toutes les salles sont déjà réservées à la date et l'heure indiquées. Veuillez choisir un autre créneau.
              </p>
              <button onClick={() => setStep(1)} className="btn-secondary mt-6">
                <ArrowLeft className="w-4 h-4" /> Modifier les dates
              </button>
            </div>
          ) : (
            <>
              {matchingRooms.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <h2 className="font-bold text-slate-900">Salles recommandées pour vous</h2>
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{matchingRooms.length} salle(s)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchingRooms.map(room => (
                      <RoomCard key={room.id} room={room} selected={selectedRoom === room.id}
                        onSelect={() => setSelectedRoom(room.id)} />
                    ))}
                  </div>
                </div>
              )}
              {otherRooms.length > 0 && (
                <div>
                  <h2 className="font-semibold text-slate-600 mb-3 text-sm">Autres salles disponibles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {otherRooms.map(room => (
                      <RoomCard key={room.id} room={room} selected={selectedRoom === room.id}
                        onSelect={() => setSelectedRoom(room.id)} />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => selectedRoom && setStep(3)}
                  disabled={!selectedRoom}
                  className="btn-primary px-8 py-3"
                >
                  Continuer <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 3 - Confirmation */}
      {step === 3 && selectedRoomData && (
        <div className="card max-w-lg mx-auto animate-slide-up">
          <h2 className="font-bold text-slate-900 text-lg mb-6">Confirmer la réservation</h2>
          <div className={`h-28 bg-gradient-to-br ${selectedRoomData.color} rounded-xl mb-5 flex items-center justify-center`}>
            <Building2 className="w-10 h-10 text-white/80" />
          </div>
          <div className="space-y-4">
            {[
              { label: 'Salle', value: selectedRoomData.name },
              { label: 'Étage', value: selectedRoomData.floor },
              { label: 'Date', value: form.date },
              { label: 'Horaire', value: form.isFullDay ? 'Journée complète' : `${form.startTime} → ${form.endTime}` },
              { label: 'Participants', value: `${form.participants} personnes` },
              { label: 'Réunion', value: form.title },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm py-2 border-b border-slate-50">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-900 text-right">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm py-2">
              <span className="text-slate-500">Statut attendu</span>
              <span className={selectedRoomData.requiresApproval ? 'badge-pending' : 'badge-confirmed'}>
                {selectedRoomData.requiresApproval ? 'En attente de validation' : 'Confirmation immédiate'}
              </span>
            </div>
          </div>
          {selectedRoomData.requiresApproval && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700 border border-amber-100">
              ⚠️ Cette salle nécessite une validation. Un email sera envoyé au responsable.
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={handleBook} disabled={isBooking} className="btn-primary flex-1">
              {isBooking ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Réservation...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Confirmer</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RoomCard({ room, selected, onSelect }: { room: any; selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className={`card cursor-pointer transition-all duration-200 ${selected
        ? 'ring-2 ring-primary-500 shadow-card-hover -translate-y-0.5'
        : 'hover:shadow-card-hover hover:-translate-y-0.5'}`}
    >
      <div className={`h-24 bg-gradient-to-br ${room.color} rounded-xl mb-4 flex items-center justify-center relative`}>
        <Building2 className="w-8 h-8 text-white/80" />
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-primary-600" />
          </div>
        )}
      </div>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-slate-900">{room.name}</h3>
        {room.requiresApproval
          ? <span className="badge badge-pending">Validation requise</span>
          : <span className="badge badge-confirmed">Confirmation auto</span>}
      </div>
      <p className="text-xs text-slate-500 mb-3">{room.floor} · {room.capacity} personnes max.</p>
      <div className="flex gap-1.5 flex-wrap">
        {room.hasVideoConf && <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"><Video className="w-3 h-3" /> Visio</span>}
        {room.hasCamera && <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"><Camera className="w-3 h-3" /> Caméra</span>}
        {room.hasMicrophone && <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"><Mic className="w-3 h-3" /> Micro</span>}
        {room.hasScreen && <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"><Monitor className="w-3 h-3" /> Écran</span>}
      </div>
    </div>
  )
}
