'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PlusCircle, Edit2, Trash2, Building2, Users, Video,
  Camera, Mic, Monitor, CheckCircle2, XCircle, Search, X, Loader2,
  Projector, Presentation, UserPlus
} from 'lucide-react'

type Room = {
  id: string
  name: string
  description: string | null
  capacity: number
  location: string | null
  floor: string | null
  building: string | null
  hasScreen: boolean
  hasCamera: boolean
  hasMicrophone: boolean
  hasVideoConf: boolean
  hasProjector: boolean
  hasWhiteboard: boolean
  hasTV: boolean
  otherFeatures: string | null
  requiresApproval: boolean
  isActive: boolean
  color: string | null
}

const COLORS = [
  { value: '#6366f1', label: 'Violet', class: 'bg-violet-500' },
  { value: '#0ea5e9', label: 'Bleu', class: 'bg-sky-500' },
  { value: '#10b981', label: 'Vert', class: 'bg-emerald-500' },
  { value: '#f59e0b', label: 'Orange', class: 'bg-amber-500' },
  { value: '#ef4444', label: 'Rouge', class: 'bg-red-500' },
  { value: '#8b5cf6', label: 'Mauve', class: 'bg-purple-500' },
  { value: '#ec4899', label: 'Rose', class: 'bg-pink-500' },
  { value: '#14b8a6', label: 'Teal', class: 'bg-teal-500' },
]

const emptyForm = {
  name: '', description: '', capacity: '', location: '', floor: '', building: '',
  hasScreen: false, hasCamera: false, hasMicrophone: false, hasVideoConf: false,
  hasProjector: false, hasWhiteboard: false, hasTV: false, otherFeatures: '',
  requiresApproval: false, isActive: true, color: '#6366f1',
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Delete confirmation
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Manager assignment
  type ManagerUser = { id: string; name: string; firstName: string | null; lastName: string | null; email: string }
  const [roomManagers, setRoomManagers] = useState<ManagerUser[]>([])
  const [managerUsers, setManagerUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([])
  const [selectedNewManager, setSelectedNewManager] = useState('')
  const [addingManager, setAddingManager] = useState(false)
  const [removingManager, setRemovingManager] = useState<string | null>(null)

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms')
      if (res.ok) setRooms(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRooms() }, [fetchRooms])

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => setManagerUsers(data.filter(u => u.role === 'manager' || u.role === 'admin')))
  }, [])

  const filtered = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.location ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // Open modal for create
  const openCreate = () => {
    setEditingRoom(null)
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  // Open modal for edit
  const openEdit = (room: Room) => {
    setEditingRoom(room)
    setForm({
      name: room.name,
      description: room.description ?? '',
      capacity: String(room.capacity),
      location: room.location ?? '',
      floor: room.floor ?? '',
      building: room.building ?? '',
      hasScreen: room.hasScreen,
      hasCamera: room.hasCamera,
      hasMicrophone: room.hasMicrophone,
      hasVideoConf: room.hasVideoConf,
      hasProjector: room.hasProjector,
      hasWhiteboard: room.hasWhiteboard,
      hasTV: room.hasTV,
      otherFeatures: room.otherFeatures ?? '',
      requiresApproval: room.requiresApproval,
      isActive: room.isActive,
      color: room.color ?? '#6366f1',
    })
    setFormError('')
    setRoomManagers([])
    setSelectedNewManager('')
    // Fetch current managers for this room
    fetch(`/api/rooms/${room.id}/managers`)
      .then(r => r.ok ? r.json() : [])
      .then(setRoomManagers)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Le nom est requis.'); return }
    if (!form.capacity || Number(form.capacity) < 1) { setFormError('La capacité doit être ≥ 1.'); return }

    setSaving(true)
    setFormError('')
    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms'
      const method = editingRoom ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, capacity: Number(form.capacity) }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'Erreur inconnue'); return }

      if (editingRoom) {
        setRooms(prev => prev.map(r => r.id === editingRoom.id ? data : r))
      } else {
        setRooms(prev => [...prev, data])
      }
      setShowModal(false)
    } catch {
      setFormError('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteRoom) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/rooms/${deleteRoom.id}`, { method: 'DELETE' })
      if (res.ok) {
        setRooms(prev => prev.filter(r => r.id !== deleteRoom.id))
        setDeleteRoom(null)
      }
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleActive = async (room: Room) => {
    const res = await fetch(`/api/rooms/${room.id}`, { method: 'PATCH' })
    if (res.ok) {
      const updated = await res.json()
      setRooms(prev => prev.map(r => r.id === room.id ? updated : r))
    }
  }

  const setField = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }))

  const handleAddManager = async () => {
    if (!editingRoom || !selectedNewManager) return
    setAddingManager(true)
    try {
      const res = await fetch(`/api/rooms/${editingRoom.id}/managers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedNewManager }),
      })
      if (res.ok) {
        const newUser = managerUsers.find(u => u.id === selectedNewManager)
        if (newUser) setRoomManagers(prev => [...prev, { id: newUser.id, name: newUser.name, firstName: null, lastName: null, email: newUser.email }])
        setSelectedNewManager('')
      }
    } finally { setAddingManager(false) }
  }

  const handleRemoveManager = async (userId: string) => {
    if (!editingRoom) return
    setRemovingManager(userId)
    try {
      const res = await fetch(`/api/rooms/${editingRoom.id}/managers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) setRoomManagers(prev => prev.filter(m => m.id !== userId))
    } finally { setRemovingManager(null) }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Gestion des salles</h1>
          <p className="page-subtitle">{rooms.length} salle{rooms.length !== 1 ? 's' : ''} configurée{rooms.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <PlusCircle className="w-4 h-4" />
          Ajouter une salle
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une salle..."
            className="input pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
          <p>{search ? 'Aucune salle trouvée' : 'Aucune salle configurée'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(room => (
            <div key={room.id} className={`card ${!room.isActive ? 'opacity-60' : ''} group`}>
              {/* Couleur */}
              <div
                className="h-28 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${room.color ?? '#6366f1'}, ${room.color ?? '#6366f1'}99)` }}
              >
                <Building2 className="w-10 h-10 text-white/70" />
                <div className="absolute top-2 right-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${room.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                    {room.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="flex items-start justify-between mb-1">
                <h3 className="font-bold text-slate-900">{room.name}</h3>
                {room.requiresApproval && (
                  <span className="badge badge-pending text-xs">Validation</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-3">
                {[room.floor, room.location].filter(Boolean).join(' · ')}{room.capacity ? ` · ${room.capacity} personnes max.` : ''}
              </p>

              {/* Équipements */}
              <div className="flex gap-1.5 flex-wrap mb-4">
                {[
                  { has: room.hasVideoConf, icon: Video, label: 'Visio' },
                  { has: room.hasCamera, icon: Camera, label: 'Caméra' },
                  { has: room.hasMicrophone, icon: Mic, label: 'Micro' },
                  { has: room.hasScreen, icon: Monitor, label: 'Écran' },
                  { has: room.hasProjector, icon: Projector, label: 'Projecteur' },
                  { has: room.hasWhiteboard, icon: Presentation, label: 'Tableau' },
                ].map(({ has, icon: Icon, label }) => has ? (
                  <span key={label} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                    <Icon className="w-3 h-3" />{label}
                  </span>
                ) : null)}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  className="btn-secondary flex-1 text-xs py-2"
                  onClick={() => openEdit(room)}
                >
                  <Edit2 className="w-3.5 h-3.5" /> Modifier
                </button>
                <button
                  className="btn-ghost text-xs py-2 text-red-500 hover:bg-red-50"
                  title="Supprimer"
                  onClick={() => setDeleteRoom(room)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  className={`btn-ghost text-xs py-2 ${room.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                  title={room.isActive ? 'Désactiver' : 'Activer'}
                  onClick={() => handleToggleActive(room)}
                >
                  {room.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== MODAL CRÉATION / ÉDITION ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingRoom ? 'Modifier la salle' : 'Ajouter une salle'}
              </h2>
              <button className="btn-ghost p-2" onClick={() => !saving && setShowModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
                  {formError}
                </div>
              )}

              {/* Infos générales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Nom de la salle *</label>
                  <input className="input" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="ex: Salle Innovation" />
                </div>
                <div>
                  <label className="label">Capacité (personnes) *</label>
                  <input className="input" type="number" min="1" value={form.capacity} onChange={e => setField('capacity', e.target.value)} placeholder="10" />
                </div>
                <div>
                  <label className="label">Bâtiment</label>
                  <input className="input" value={form.building} onChange={e => setField('building', e.target.value)} placeholder="Siège" />
                </div>
                <div>
                  <label className="label">Étage</label>
                  <input className="input" value={form.floor} onChange={e => setField('floor', e.target.value)} placeholder="2ème étage" />
                </div>
                <div>
                  <label className="label">Localisation</label>
                  <input className="input" value={form.location} onChange={e => setField('location', e.target.value)} placeholder="Bâtiment A" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Description</label>
                  <textarea className="input min-h-[80px]" value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Description de la salle..." />
                </div>
              </div>

              {/* Couleur */}
              <div>
                <label className="label mb-2">Couleur</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setField('color', c.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${form.color === c.value ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Équipements */}
              <div>
                <label className="label mb-2">Équipements</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'hasVideoConf', label: 'Visio-conférence' },
                    { key: 'hasCamera', label: 'Caméra' },
                    { key: 'hasMicrophone', label: 'Microphone' },
                    { key: 'hasScreen', label: 'Écran' },
                    { key: 'hasProjector', label: 'Projecteur' },
                    { key: 'hasWhiteboard', label: 'Tableau blanc' },
                    { key: 'hasTV', label: 'Télévision' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={(form as any)[key]}
                        onChange={e => setField(key, e.target.checked)}
                        className="w-4 h-4 accent-primary-600"
                      />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.requiresApproval}
                    onChange={e => setField('requiresApproval', e.target.checked)}
                    className="w-4 h-4 accent-primary-600"
                  />
                  <span className="text-sm text-slate-700">Nécessite une validation manager</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setField('isActive', e.target.checked)}
                    className="w-4 h-4 accent-primary-600"
                  />
                  <span className="text-sm text-slate-700">Salle active (visible pour les réservations)</span>
                </label>
              </div>

              {/* Responsables — uniquement pour les salles existantes */}
              {editingRoom && (
                <div className="border-t border-slate-100 pt-4">
                  <label className="label mb-3 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    Responsables de la salle
                  </label>
                  <div className="space-y-2">
                    {roomManagers.length === 0 && (
                      <p className="text-xs text-slate-400 italic px-2">Aucun responsable assigné</p>
                    )}
                    {roomManagers.map(m => {
                      const displayName = m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.name
                      return (
                        <div key={m.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                          <div>
                            <div className="text-sm font-medium text-slate-800">{displayName}</div>
                            <div className="text-xs text-slate-400">{m.email}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveManager(m.id)}
                            disabled={removingManager === m.id}
                            className="btn-ghost p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                            title="Retirer"
                          >
                            {removingManager === m.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <X className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )
                    })}
                    {/* Add manager */}
                    {managerUsers.filter(u => !roomManagers.some(m => m.id === u.id)).length > 0 && (
                      <div className="flex gap-2 mt-3">
                        <select
                          className="input text-sm flex-1"
                          value={selectedNewManager}
                          onChange={e => setSelectedNewManager(e.target.value)}
                        >
                          <option value="">Ajouter un responsable...</option>
                          {managerUsers
                            .filter(u => !roomManagers.some(m => m.id === u.id))
                            .map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddManager}
                          disabled={!selectedNewManager || addingManager}
                          className="btn-primary text-sm px-3 py-2"
                        >
                          {addingManager ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajouter'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button className="btn-secondary" onClick={() => !saving && setShowModal(false)} disabled={saving}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</> : editingRoom ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL SUPPRESSION ===== */}
      {deleteRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteRoom(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Supprimer la salle</h2>
            </div>
            <p className="text-slate-600 mb-6">
              Êtes-vous sûr de vouloir supprimer <strong>{deleteRoom.name}</strong> ?
              Cette action est irréversible et supprimera toutes les réservations associées.
            </p>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setDeleteRoom(null)} disabled={deleting}>
                Annuler
              </button>
              <button
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-600"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Suppression...</> : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
