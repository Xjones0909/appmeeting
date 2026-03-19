import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany()
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
    return NextResponse.json(map)
  } catch {
    return NextResponse.json({
      app_name: 'Bourcha',
      app_subtitle: 'Room Booking',
      app_tagline: 'Réservez vos salles de réunion en quelques secondes.',
      company_name: 'BOURCHANIN & CIE',
      company_year: new Date().getFullYear().toString(),
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const updates = Object.entries(body)
    for (const [key, value] of updates) {
      await prisma.appSetting.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
