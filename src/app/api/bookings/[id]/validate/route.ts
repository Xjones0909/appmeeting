import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role
    if (!session?.user || !['manager', 'admin'].includes(role))
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const { id } = await params
    const body = await request.json()
    const { action, comment } = body // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action))
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 })

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: { include: { managers: true } } }
    })

    if (!booking) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    if (booking.status !== 'PENDING')
      return NextResponse.json({ error: 'Cette réservation ne peut plus être modifiée' }, { status: 400 })

    if (role === 'manager') {
      const myId = (session.user as any).id
      const isManager = booking.room.managers.some((m: any) => m.userId === myId)
      if (!isManager) return NextResponse.json({ error: 'Vous ne gérez pas cette salle' }, { status: 403 })
    }

    const newStatus = action === 'approve' ? 'VALIDATED' : 'REJECTED'
    const validatedById = (session.user as any).id

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: newStatus,
        validatedById,
        validatedAt: new Date(),
        validationComment: comment || null,
      },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /api/bookings/[id]/validate error:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
