import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const role = (session.user as any).role
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs et responsables' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const roomId     = searchParams.get('roomId')
    const dateFrom   = searchParams.get('dateFrom')
    const dateTo     = searchParams.get('dateTo')
    const status     = searchParams.get('status')
    const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit      = Math.min(100, parseInt(searchParams.get('limit') ?? '20'))
    const skip       = (page - 1) * limit

    const where: any = {}
    if (roomId) where.roomId = roomId
    if (status) where.status = status
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom + 'T00:00:00.000Z')
      if (dateTo)   where.date.lte = new Date(dateTo   + 'T23:59:59.999Z')
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, firstName: true, lastName: true, email: true, department: true } },
          room: { select: { id: true, name: true, floor: true, building: true, capacity: true, color: true } },
        },
        orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({ bookings, total, page, limit })
  } catch (error) {
    console.error('GET /api/history error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
