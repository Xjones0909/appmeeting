// Bourcha Room Booking — Permission System

export const PERMISSIONS = [
  // Réservations
  { key: 'booking.create',     label: 'Créer une réservation',                        category: 'Réservations' },
  { key: 'booking.edit_own',   label: 'Modifier ses propres réservations',             category: 'Réservations' },
  { key: 'booking.delete_own', label: 'Supprimer ses propres réservations',            category: 'Réservations' },
  { key: 'booking.view_all',   label: 'Voir toutes les réservations',                  category: 'Réservations' },
  { key: 'booking.validate',   label: 'Valider / rejeter des demandes',                category: 'Réservations' },
  // Salles
  { key: 'room.view',          label: 'Consulter les salles',                          category: 'Salles' },
  { key: 'room.book',          label: 'Réserver une salle',                            category: 'Salles' },
  { key: 'room.manage',        label: 'Gérer les salles (créer / modifier / supprimer)', category: 'Salles' },
  // Administration
  { key: 'user.manage',        label: 'Gérer les utilisateurs',                        category: 'Administration' },
  { key: 'profile.manage',     label: 'Gérer les profils et permissions',              category: 'Administration' },
  { key: 'settings.manage',    label: 'Modifier les paramètres application',           category: 'Administration' },
  // Rapports
  { key: 'history.view_all',   label: `Consulter l'historique global des réservations`, category: 'Rapports' },
] as const

export type PermissionKey = typeof PERMISSIONS[number]['key']
export const PERMISSION_CATEGORIES = ['Réservations', 'Salles', 'Administration', 'Rapports'] as const

export const DEFAULT_PERMISSIONS: Record<string, PermissionKey[]> = {
  admin: [
    'booking.create', 'booking.edit_own', 'booking.delete_own', 'booking.view_all', 'booking.validate',
    'room.view', 'room.book', 'room.manage',
    'user.manage', 'profile.manage', 'settings.manage',
    'history.view_all',
  ],
  manager: [
    'booking.create', 'booking.edit_own', 'booking.delete_own', 'booking.view_all', 'booking.validate',
    'room.view', 'room.book',
    'history.view_all',
  ],
  user: [
    'booking.create', 'booking.edit_own', 'booking.delete_own',
    'room.view', 'room.book',
  ],
}

export function parsePermissions(raw: string | null | undefined): PermissionKey[] {
  try { return JSON.parse(raw ?? '[]') ?? [] } catch { return [] }
}
