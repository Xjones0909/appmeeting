import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const reason = body.reason || null

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })

    const myId = (session.user as any).id
    const role = (session.user as any).role
    if (booking.userId !== myId && role !== 'admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    if (['CANCELLED', 'REJECTED'].includes(booking.status))
      return NextResponse.json({ error: 'Déjà annulée' }, { status: 400 })

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
