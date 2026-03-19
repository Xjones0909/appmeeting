import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(users.map(u => ({
      id: u.id, email: u.email, name: u.name,
      firstName: u.firstName, lastName: u.lastName,
      phone: u.phone, department: u.department,
      role: u.role.name, roleId: u.roleId,
      isActive: u.isActive, createdAt: u.createdAt,
    })))
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const body = await request.json()
    const { email, firstName, lastName, password, roleId, phone, department, isActive } = body

    if (!email || !firstName || !lastName || !password || !roleId)
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 12)
    const name = firstName + ' ' + lastName

    const user = await prisma.user.create({
      data: { email, name, firstName, lastName, password: hashed, roleId,
        phone: phone || null, department: department || null, isActive: isActive ?? true },
      include: { role: true },
    })
    return NextResponse.json({
      id: user.id, email: user.email, name: user.name,
      firstName: user.firstName, lastName: user.lastName,
      role: user.role.name, isActive: user.isActive,
    }, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
