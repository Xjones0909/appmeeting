import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    const { id } = await params
    const user = await prisma.user.findUnique({ where: { id }, include: { role: true } })
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
    return NextResponse.json({
      id: user.id, email: user.email, name: user.name,
      firstName: user.firstName, lastName: user.lastName,
      phone: user.phone, department: user.department,
      role: user.role.name, roleId: user.roleId,
      isActive: user.isActive, createdAt: user.createdAt,
    })
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const { id } = await params
    const body = await request.json()
    const { email, firstName, lastName, roleId, phone, department, isActive, password } = body

    const data: any = {}
    if (email) data.email = email
    if (firstName !== undefined) data.firstName = firstName
    if (lastName !== undefined) data.lastName = lastName
    if (firstName !== undefined || lastName !== undefined) {
      const current = await prisma.user.findUnique({ where: { id }, select: { firstName: true, lastName: true } })
      const fn = firstName ?? current?.firstName ?? ''
      const ln = lastName ?? current?.lastName ?? ''
      data.name = (fn + ' ' + ln).trim()
    }
    if (roleId) data.roleId = roleId
    if (phone !== undefined) data.phone = phone || null
    if (department !== undefined) data.department = department || null
    if (isActive !== undefined) data.isActive = isActive
    if (password) data.password = await bcrypt.hash(password, 12)

    const user = await prisma.user.update({ where: { id }, data, include: { role: true } })
    return NextResponse.json({
      id: user.id, email: user.email, name: user.name,
      firstName: user.firstName, lastName: user.lastName,
      role: user.role.name, isActive: user.isActive,
    })
  } catch (e: any) {
    if (e.code === 'P2025') return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    if (e.code === 'P2002') return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    const { id } = await params
    const myId = (session.user as any).id
    if (id === myId) return NextResponse.json({ error: 'Impossible de se désactiver soi-même' }, { status: 400 })
    await prisma.user.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ message: 'Utilisateur désactivé' })
  } catch (e: any) {
    if (e.code === 'P2025') return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
