import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session || !['admin', 'manager'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    const { name, description, capacity, location, floor, building, hasScreen, hasCamera, hasMicrophone, hasVideoConf, hasProjector, hasWhiteboard, hasTV, otherFeatures, requiresApproval, isActive, color } = body
    if (!name || !capacity) return NextResponse.json({ error: 'Nom et capacité requis' }, { status: 400 })
    const room = await prisma.room.update({
      where: { id },
      data: { name, description: description || null, capacity: Number(capacity), location: location || null, floor: floor || null, building: building || null, hasScreen: Boolean(hasScreen), hasCamera: Boolean(hasCamera), hasMicrophone: Boolean(hasMicrophone), hasVideoConf: Boolean(hasVideoConf), hasProjector: Boolean(hasProjector), hasWhiteboard: Boolean(hasWhiteboard), hasTV: Boolean(hasTV), otherFeatures: otherFeatures || null, requiresApproval: Boolean(requiresApproval), isActive: Boolean(isActive), color: color || '#6366f1' },
    })
    return NextResponse.json(room)
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 })
    if (error.code === 'P2002') return NextResponse.json({ error: 'Une salle avec ce nom existe déjà' }, { status: 409 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session || !['admin', 'manager'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { id } = await params
    await prisma.room.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(_request: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session || !['admin', 'manager'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { id } = await params
    const current = await prisma.room.findUnique({ where: { id }, select: { isActive: true } })
    if (!current) return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 })
    const room = await prisma.room.update({ where: { id }, data: { isActive: !current.isActive } })
    return NextResponse.json(room)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
