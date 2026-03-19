'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PlusCircle, Search, Edit2, UserX, UserCheck, Loader2, X,
  User, Mail, Phone, Building2, Shield, Lock, Eye, EyeOff, Users,
  ShieldCheck, Trash2, ChevronDown, ChevronUp, Check, AlertCircle
} from 'lucide-react'
import { PERMISSIONS, PERMISSION_CATEGORIES, DEFAULT_PERMISSIONS } from '@/lib/permissions'
import type { PermissionKey } from '@/lib/permissions'

// ─── Types ───────────────────────────────────────────────────────────────────

type UserData = {
  id: string; email: string; name: string; firstName: string | null
  lastName: string | null; phone: string | null; department: string | null
  role: string; roleId: string; isActive: boolean; createdAt: string
}
type RoleData = {
  id: string; name: string; label: string
  isSystem: boolean; permissions: PermissionKey[]; color: string
  userCount: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYSTEM_COLORS = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6']

const roleBadgeClass = (name: string, color?: string) => {
  const map: Record<string,string> = {
    admin: 'bg-violet-100 text-violet-700',
    manager: 'bg-blue-100 text-blue-700',
    user: 'bg-slate-100 text-slate-600',
  }
  return map[name] ?? 'bg-emerald-100 text-emerald-700'
}

const emptyForm = { firstName:'', lastName:'', email:'', roleId:'', phone:'', department:'', password:'', isActive: true }
const emptyRoleForm = { name:'', label:'', permissions: [] as PermissionKey[], color: '#6366f1' }

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [tab, setTab] = useState<'users'|'profiles'>('users')

  // Users state
  const [users, setUsers] = useState<UserData[]>([])
  const [roles, setRoles] = useState<RoleData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmToggle, setConfirmToggle] = useState<UserData | null>(null)
  const [toggling, setToggling] = useState(false)

  // Profiles state
  const [showNewProfile, setShowNewProfile] = useState(false)
  const [newRoleForm, setNewRoleForm] = useState(emptyRoleForm)
  const [newRoleError, setNewRoleError] = useState('')
  const [savingNewRole, setSavingNewRole] = useState(false)
  const [editingPermRole, setEditingPermRole] = useState<string | null>(null)
  const [localPerms, setLocalPerms] = useState<Record<string, PermissionKey[]>>({})
  const [savingPerm, setSavingPerm] = useState<string | null>(null)
  const [deletingRole, setDeletingRole] = useState<string | null>(null)
  const [expandedRole, setExpandedRole] = useState<string | null>(null)

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [uRes, rRes] = await Promise.all([fetch('/api/users'), fetch('/api/roles')])
      if (uRes.ok) setUsers(await uRes.json())
      if (rRes.ok) {
        const rolesData: RoleData[] = await rRes.json()
        setRoles(rolesData)
        // Init local permissions
        const init: Record<string, PermissionKey[]> = {}
        rolesData.forEach(r => { init[r.id] = r.permissions })
        setLocalPerms(init)
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Users helpers ─────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department ?? '').toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const openCreate = () => {
    setEditingUser(null)
    setForm({ ...emptyForm, roleId: roles.find(r => r.name === 'user')?.id ?? '' })
    setFormError(''); setShowPassword(false); setShowModal(true)
  }
  const openEdit = (user: UserData) => {
    setEditingUser(user)
    setForm({ firstName: user.firstName ?? '', lastName: user.lastName ?? '', email: user.email,
      roleId: user.roleId, phone: user.phone ?? '', department: user.department ?? '',
      password: '', isActive: user.isActive })
    setFormError(''); setShowPassword(false); setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.firstName.trim()) { setFormError('Le prénom est requis.'); return }
    if (!form.lastName.trim()) { setFormError('Le nom est requis.'); return }
    if (!form.email.trim()) { setFormError("L'email est requis."); return }
    if (!form.roleId) { setFormError('Le profil est requis.'); return }
    if (!editingUser && !form.password) { setFormError('Le mot de passe est requis.'); return }
    setSaving(true); setFormError('')
    try {
      const payload: any = { firstName: form.firstName, lastName: form.lastName,
        email: form.email, roleId: form.roleId, phone: form.phone || null,
        department: form.department || null, isActive: form.isActive }
      if (form.password) payload.password = form.password
      const res = await fetch(editingUser ? `/api/users/${editingUser.id}` : '/api/users',
        { method: editingUser ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'Erreur inconnue'); return }
      await fetchData(); setShowModal(false)
    } catch { setFormError('Erreur de connexion') } finally { setSaving(false) }
  }

  const handleToggleActive = async () => {
    if (!confirmToggle) return
    setToggling(true)
    try {
      const res = await fetch(`/api/users/${confirmToggle.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !confirmToggle.isActive }) })
      if (res.ok) { setUsers(prev => prev.map(u => u.id === confirmToggle.id ? { ...u, isActive: !confirmToggle.isActive } : u)); setConfirmToggle(null) }
    } finally { setToggling(false) }
  }

  const setField = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }))

  // ─── Profiles helpers ──────────────────────────────────────────────────────

  const togglePermission = (roleId: string, perm: PermissionKey) => {
    setLocalPerms(prev => {
      const current = prev[roleId] ?? []
      return { ...prev, [roleId]: current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm] }
    })
  }

  const savePermissions = async (roleId: string) => {
    setSavingPerm(roleId)
    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: localPerms[roleId] ?? [] }) })
      if (res.ok) {
        setRoles(prev => prev.map(r => r.id === roleId ? { ...r, permissions: localPerms[roleId] ?? [] } : r))
        setEditingPermRole(null)
      }
    } finally { setSavingPerm(null) }
  }

  const handleCreateRole = async () => {
    if (!newRoleForm.name.trim()) { setNewRoleError('Nom technique requis'); return }
    if (!newRoleForm.label.trim()) { setNewRoleError('Libellé requis'); return }
    setSavingNewRole(true); setNewRoleError('')
    try {
      const res = await fetch('/api/roles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoleForm) })
      const data = await res.json()
      if (!res.ok) { setNewRoleError(data.error || 'Erreur'); return }
      await fetchData(); setShowNewProfile(false); setNewRoleForm(emptyRoleForm)
    } catch { setNewRoleError('Erreur de connexion') } finally { setSavingNewRole(false) }
  }

  const handleDeleteRole = async (roleId: string) => {
    setDeletingRole(roleId)
    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { alert(data.error); return }
      await fetchData()
    } finally { setDeletingRole(null) }
  }

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Gestion des utilisateurs</h1>
          <p className="page-subtitle">{users.length} utilisateur{users.length !== 1 ? 's' : ''}</p>
        </div>
        {tab === 'users' && (
          <button className="btn-primary" onClick={openCreate}>
            <PlusCircle className="w-4 h-4" /> Ajouter un utilisateur
          </button>
        )}
        {tab === 'profiles' && (
          <button className="btn-primary" onClick={() => { setShowNewProfile(true); setNewRoleForm(emptyRoleForm); setNewRoleError('') }}>
            <PlusCircle className="w-4 h-4" /> Nouveau profil
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
        {([['users', 'Utilisateurs', Users], ['profiles', 'Profils & Permissions', ShieldCheck]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════ TAB: USERS */}
      {tab === 'users' && (
        <>
          <div className="card mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Rechercher..." className="input pl-10"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="input sm:w-48" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="">Tous les profils</option>
                {roles.map(r => <option key={r.id} value={r.name}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mr-2" /> Chargement...
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50">
                    <tr>
                      {['Utilisateur','Email','Profil','Département','Statut','Créé le','Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>Aucun utilisateur trouvé</p>
                      </td></tr>
                    ) : filtered.map(user => {
                      const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name
                      const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                      const userRole = roles.find(r => r.id === user.roleId)
                      return (
                        <tr key={user.id} className={`transition-colors ${!user.isActive ? 'opacity-50' : 'hover:bg-slate-50/50'}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{initials}</div>
                              <div>
                                <div className="font-medium text-slate-800">{displayName}</div>
                                {user.phone && <div className="text-xs text-slate-400">{user.phone}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600 text-xs">{user.email}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleBadgeClass(user.role)}`}>
                              {userRole?.label ?? user.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs">{user.department ?? '—'}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {user.isActive ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEdit(user)} className="btn-ghost p-1.5 text-slate-400 hover:text-primary-600" title="Modifier"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setConfirmToggle(user)}
                                className={`btn-ghost p-1.5 ${user.isActive ? 'text-slate-400 hover:text-red-500' : 'text-slate-400 hover:text-emerald-600'}`}
                                title={user.isActive ? 'Désactiver' : 'Activer'}>
                                {user.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ TAB: PROFILES */}
      {tab === 'profiles' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mr-2" /> Chargement...
            </div>
          ) : roles.map(role => {
            const isExpanded = expandedRole === role.id
            const isEditingPerm = editingPermRole === role.id
            const perms = isEditingPerm ? (localPerms[role.id] ?? []) : role.permissions
            const isAdminLocked = role.name === 'admin'

            return (
              <div key={role.id} className="card overflow-hidden">
                {/* Role header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (role.color ?? '#6366f1') + '20' }}>
                      <ShieldCheck className="w-5 h-5" style={{ color: role.color ?? '#6366f1' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{role.label}</span>
                        {role.isSystem && (
                          <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">Système</span>
                        )}
                        {isAdminLocked && (
                          <span className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Verrouillé
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {role.userCount} utilisateur{role.userCount !== 1 ? 's' : ''} · {perms.length} permission{perms.length !== 1 ? 's' : ''}
                        {!role.isSystem && <span className="ml-2 font-mono bg-slate-50 px-1 rounded text-slate-400">{role.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isAdminLocked && !isEditingPerm && (
                      <button
                        onClick={() => { setEditingPermRole(role.id); setExpandedRole(role.id) }}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        <Edit2 className="w-3 h-3" /> Modifier
                      </button>
                    )}
                    {!isAdminLocked && isEditingPerm && (
                      <>
                        <button onClick={() => { setEditingPermRole(null); setLocalPerms(p => ({ ...p, [role.id]: role.permissions })) }}
                          className="btn-secondary text-xs py-1.5 px-3" disabled={savingPerm === role.id}>
                          Annuler
                        </button>
                        <button onClick={() => savePermissions(role.id)} className="btn-primary text-xs py-1.5 px-3" disabled={savingPerm === role.id}>
                          {savingPerm === role.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Enregistrer
                        </button>
                      </>
                    )}
                    {!role.isSystem && (
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={deletingRole === role.id || role.userCount > 0}
                        title={role.userCount > 0 ? `${role.userCount} utilisateur(s) assigné(s)` : 'Supprimer'}
                        className={`btn-ghost p-1.5 ${role.userCount > 0 ? 'opacity-30 cursor-not-allowed' : 'text-red-400 hover:text-red-600'}`}
                      >
                        {deletingRole === role.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                    <button onClick={() => setExpandedRole(isExpanded ? null : role.id)} className="btn-ghost p-1.5 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Permissions grid */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                    {PERMISSION_CATEGORIES.map(cat => {
                      const catPerms = PERMISSIONS.filter(p => p.category === cat)
                      return (
                        <div key={cat}>
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{cat}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {catPerms.map(perm => {
                              const active = perms.includes(perm.key as PermissionKey)
                              const locked = isAdminLocked
                              return (
                                <label key={perm.key}
                                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${locked ? 'cursor-default' : isEditingPerm ? 'cursor-pointer hover:border-primary-300' : 'cursor-default'} ${active ? 'border-primary-200 bg-primary-50' : 'border-slate-100 bg-slate-50'}`}
                                >
                                  <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${active ? 'bg-primary-600 border-primary-600' : 'border-slate-300 bg-white'}`}>
                                    {active && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  {isEditingPerm && !locked && (
                                    <input type="checkbox" className="sr-only"
                                      checked={active}
                                      onChange={() => togglePermission(role.id, perm.key as PermissionKey)} />
                                  )}
                                  <div onClick={() => isEditingPerm && !locked && togglePermission(role.id, perm.key as PermissionKey)}>
                                    <div className={`text-sm font-medium ${active ? 'text-primary-700' : 'text-slate-600'}`}>{perm.label}</div>
                                    <div className="text-xs text-slate-400 font-mono">{perm.key}</div>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ MODAL: NEW PROFILE */}
      {showNewProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !savingNewRole && setShowNewProfile(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Nouveau profil</h2>
              <button className="btn-ghost p-2" onClick={() => !savingNewRole && setShowNewProfile(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {newRoleError && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{newRoleError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nom technique *</label>
                  <input className="input font-mono" value={newRoleForm.name}
                    onChange={e => setNewRoleForm(p => ({ ...p, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'') }))}
                    placeholder="ex: comptable" />
                  <p className="text-xs text-slate-400 mt-1">Lettres minuscules, chiffres, underscore</p>
                </div>
                <div>
                  <label className="label">Libellé affiché *</label>
                  <input className="input" value={newRoleForm.label}
                    onChange={e => setNewRoleForm(p => ({ ...p, label: e.target.value }))}
                    placeholder="ex: Comptable" />
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="label">Couleur du profil</label>
                <div className="flex gap-2 flex-wrap">
                  {SYSTEM_COLORS.map(c => (
                    <button key={c} onClick={() => setNewRoleForm(p => ({ ...p, color: c }))}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${newRoleForm.color === c ? 'border-slate-700 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="label mb-2 block">Permissions</label>
                <div className="space-y-3">
                  {PERMISSION_CATEGORIES.map(cat => (
                    <div key={cat}>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{cat}</div>
                      <div className="space-y-1.5">
                        {PERMISSIONS.filter(p => p.category === cat).map(perm => {
                          const active = newRoleForm.permissions.includes(perm.key as PermissionKey)
                          return (
                            <label key={perm.key} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${active ? 'border-primary-200 bg-primary-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                              <input type="checkbox" className="sr-only" checked={active}
                                onChange={() => setNewRoleForm(p => ({
                                  ...p,
                                  permissions: active ? p.permissions.filter(k => k !== perm.key) : [...p.permissions, perm.key as PermissionKey]
                                }))} />
                              <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${active ? 'bg-primary-600 border-primary-600' : 'border-slate-300'}`}>
                                {active && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <span className={`text-sm ${active ? 'text-primary-700 font-medium' : 'text-slate-600'}`}>{perm.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button className="btn-secondary" onClick={() => setShowNewProfile(false)} disabled={savingNewRole}>Annuler</button>
              <button className="btn-primary" onClick={handleCreateRole} disabled={savingNewRole}>
                {savingNewRole ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</> : 'Créer le profil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ MODAL: USER FORM */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingUser ? "Modifier l'utilisateur" : 'Ajouter un utilisateur'}
              </h2>
              <button className="btn-ghost p-2" onClick={() => !saving && setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {formError && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">{formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label"><User className="w-3.5 h-3.5 inline mr-1" />Prénom *</label>
                  <input className="input" value={form.firstName} onChange={e => setField('firstName', e.target.value)} placeholder="Ahmed" />
                </div>
                <div>
                  <label className="label">Nom *</label>
                  <input className="input" value={form.lastName} onChange={e => setField('lastName', e.target.value)} placeholder="Benali" />
                </div>
              </div>
              <div>
                <label className="label"><Mail className="w-3.5 h-3.5 inline mr-1" />Email *</label>
                <input className="input" type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="a.benali@bourcha.ma" />
              </div>
              <div>
                <label className="label"><Shield className="w-3.5 h-3.5 inline mr-1" />Profil *</label>
                <select className="input" value={form.roleId} onChange={e => setField('roleId', e.target.value)}>
                  <option value="">Sélectionner un profil</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.label}{r.isSystem ? '' : ' (personnalisé)'}</option>)}
                </select>
                {form.roleId && (() => {
                  const r = roles.find(x => x.id === form.roleId)
                  return r ? (
                    <p className="text-xs text-slate-400 mt-1">
                      {r.permissions.length} permission{r.permissions.length !== 1 ? 's' : ''} accordée{r.permissions.length !== 1 ? 's' : ''}
                    </p>
                  ) : null
                })()}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label"><Building2 className="w-3.5 h-3.5 inline mr-1" />Département</label>
                  <input className="input" value={form.department} onChange={e => setField('department', e.target.value)} placeholder="RH, IT..." />
                </div>
                <div>
                  <label className="label"><Phone className="w-3.5 h-3.5 inline mr-1" />Téléphone</label>
                  <input className="input" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+212 6..." />
                </div>
              </div>
              <div>
                <label className="label"><Lock className="w-3.5 h-3.5 inline mr-1" />{editingUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}</label>
                <div className="relative">
                  <input className="input pr-10" type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={e => setField('password', e.target.value)}
                    placeholder={editingUser ? 'Laisser vide pour ne pas changer' : '8 caractères minimum'} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <input type="checkbox" checked={form.isActive} onChange={e => setField('isActive', e.target.checked)} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm text-slate-700">Compte actif (peut se connecter)</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button className="btn-secondary" onClick={() => !saving && setShowModal(false)} disabled={saving}>Annuler</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</> : editingUser ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ MODAL: TOGGLE ACTIVE */}
      {confirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !toggling && setConfirmToggle(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${confirmToggle.isActive ? 'bg-red-100' : 'bg-emerald-100'}`}>
                {confirmToggle.isActive ? <UserX className="w-5 h-5 text-red-600" /> : <UserCheck className="w-5 h-5 text-emerald-600" />}
              </div>
              <h2 className="text-lg font-bold text-slate-900">{confirmToggle.isActive ? 'Désactiver' : 'Activer'} le compte</h2>
            </div>
            <p className="text-slate-600 mb-6 text-sm">
              {confirmToggle.isActive ? `Désactiver le compte de ${confirmToggle.name} ?` : `Réactiver le compte de ${confirmToggle.name} ?`}
            </p>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setConfirmToggle(null)} disabled={toggling}>Annuler</button>
              <button className={`btn-primary ${confirmToggle.isActive ? 'bg-red-600 hover:bg-red-700 border-red-600' : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600'}`}
                onClick={handleToggleActive} disabled={toggling}>
                {toggling ? <><Loader2 className="w-4 h-4 animate-spin" /> Traitement...</> : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
