import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    const { id } = await params
    const managers = await prisma.roomManager.findMany({
      where: { roomId: id },
      include: { user: { select: { id: true, name: true, firstName: true, lastName: true, email: true } } },
    })
    return NextResponse.json(managers.map(m => m.user))
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    const { id: roomId } = await params
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    await prisma.roomManager.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: { roomId, userId },
      update: {},
    })
    return NextResponse.json({ message: 'Responsable ajouté' }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    const { id: roomId } = await params
    const { userId } = await request.json()
    await prisma.roomManager.delete({ where: { roomId_userId: { roomId, userId } } })
    return NextResponse.json({ message: 'Responsable supprimé' })
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}
