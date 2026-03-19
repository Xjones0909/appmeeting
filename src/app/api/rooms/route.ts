import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const rooms = await prisma.room.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(rooms)
  } catch (error) {
    console.error('GET /api/rooms error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || !['admin', 'manager'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name, description, capacity, location, floor, building,
      hasScreen, hasCamera, hasMicrophone, hasVideoConf, hasProjector,
      hasWhiteboard, hasTV, otherFeatures, requiresApproval, isActive, color,
    } = body

    if (!name || !capacity) {
      return NextResponse.json({ error: 'Nom et capacité requis' }, { status: 400 })
    }

    const room = await prisma.room.create({
      data: {
        name,
        description: description || null,
        capacity: Number(capacity),
        location: location || null,
        floor: floor || null,
        building: building || null,
        hasScreen: Boolean(hasScreen),
        hasCamera: Boolean(hasCamera),
        hasMicrophone: Boolean(hasMicrophone),
        hasVideoConf: Boolean(hasVideoConf),
        hasProjector: Boolean(hasProjector),
        hasWhiteboard: Boolean(hasWhiteboard),
        hasTV: Boolean(hasTV),
        otherFeatures: otherFeatures || null,
        requiresApproval: Boolean(requiresApproval),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        color: color || '#6366f1',
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/rooms error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Une salle avec ce nom existe déjà' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
