import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.role.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

    // System roles: only permissions can be updated (not name/label for admin)
    const updateData: any = {}
    if (!existing.isSystem || existing.name !== 'admin') {
      if (body.label !== undefined) updateData.label = body.label
      if (body.color !== undefined) updateData.color = body.color
    }
    if (body.permissions !== undefined)
      updateData.permissions = JSON.stringify(body.permissions)

    const updated = await prisma.role.update({ where: { id }, data: updateData })
    return NextResponse.json({
      ...updated,
      permissions: (() => { try { return JSON.parse(updated.permissions) } catch { return [] } })(),
    })
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    const { id } = await params

    const existing = await prisma.role.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    if (existing.isSystem) return NextResponse.json({ error: 'Impossible de supprimer un profil système' }, { status: 400 })

    const userCount = await prisma.user.count({ where: { roleId: id } })
    if (userCount > 0) return NextResponse.json({ error: `${userCount} utilisateur(s) ont ce profil. Réassignez-les d'abord.` }, { status: 400 })

    await prisma.role.delete({ where: { id } })
    return NextResponse.json({ message: 'Profil supprimé' })
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}
