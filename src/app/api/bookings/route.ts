import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const date = searchParams.get('date')
    const mine = searchParams.get('mine') === 'true'
    const statusFilter = searchParams.get('status')
    const pendingValidation = searchParams.get('pending') === 'true'

    const userId = (session.user as any).id
    const role = (session.user as any).role

    const where: any = {}
    if (roomId) where.roomId = roomId
    if (date) where.date = new Date(date)
    if (mine) where.userId = userId
    if (statusFilter) where.status = statusFilter

    if (pendingValidation) {
      where.status = 'PENDING'
      if (role === 'manager') {
        const managed = await prisma.roomManager.findMany({ where: { userId }, select: { roomId: true } })
        where.roomId = { in: managed.map(r => r.roomId) }
      }
      const bookings = await prisma.booking.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, firstName: true, lastName: true, email: true, department: true } },
          room: { select: { id: true, name: true, floor: true, building: true, color: true, capacity: true } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      })
      return NextResponse.json(bookings)
    }

    if (!roomId && !date && !mine && !statusFilter) {
      where.status = { in: ['PENDING', 'CONFIRMED', 'VALIDATED'] }
    }

    const bookings = await prisma.booking.findMany({
      where,
      select: { id: true, startTime: true, endTime: true, title: true, roomId: true, status: true, date: true, participants: true, notes: true, userId: true },
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    })
    return NextResponse.json(bookings)
  } catch (error) {
    console.error('GET /api/bookings error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { roomId, title, date, startTime, endTime, participants, notes } = body

    if (!roomId || !title || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    if (startTime < '08:00' || endTime > '18:00') {
      return NextResponse.json({ error: 'Les réservations sont possibles uniquement de 08h00 à 18h00' }, { status: 400 })
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room || !room.isActive) {
      return NextResponse.json({ error: 'Salle introuvable ou inactive' }, { status: 404 })
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        roomId, date: new Date(date),
        status: { in: ['PENDING', 'CONFIRMED', 'VALIDATED'] },
        OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
      },
    })
    if (conflict) {
      return NextResponse.json({ error: 'Ce créneau est déjà réservé pour cette salle' }, { status: 409 })
    }

    const userId = (session.user as any).id
    const status = room.requiresApproval ? 'PENDING' : 'CONFIRMED'

    const booking = await prisma.booking.create({
      data: {
        userId, roomId, title,
        date: new Date(date),
        startTime, endTime,
        participants: participants ? Number(participants) : 1,
        notes: notes || null,
        status,
      },
      include: { room: true },
    })
    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('POST /api/bookings error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
