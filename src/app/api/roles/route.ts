import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    const roles = await prisma.role.findMany({ orderBy: { createdAt: 'asc' } })
    const counts = await prisma.user.groupBy({ by: ['roleId'], _count: { _all: true } })
    const countMap = Object.fromEntries(counts.map((c: any) => [c.roleId, c._count._all]))
    return NextResponse.json(roles.map((r: any) => ({
      ...r,
      permissions: (() => { try { return JSON.parse(r.permissions) } catch { return [] } })(),
      userCount: countMap[r.id] ?? 0,
    })))
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const { name, label, permissions = [], color } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    if (!label?.trim()) return NextResponse.json({ error: 'Libellé requis' }, { status: 400 })
    if (['admin', 'manager', 'user'].includes(name.toLowerCase()))
      return NextResponse.json({ error: 'Ce nom est réservé au système' }, { status: 400 })

    const role = await prisma.role.create({
      data: {
        name: name.trim().toLowerCase().replace(/\s+/g, '_'),
        label: label.trim(),
        permissions: JSON.stringify(permissions),
        color: color ?? '#6366f1',
        isSystem: false,
      },
    })
    return NextResponse.json({ ...role, permissions }, { status: 201 })
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Ce nom de profil existe déjà' }, { status: 409 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
