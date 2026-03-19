import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ===== ROLES =====
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', label: 'Administrateur' },
  })
  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: { name: 'manager', label: 'Responsable' },
  })
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user', label: 'Utilisateur' },
  })

  // ===== USERS =====
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bourcha.com' },
    update: {},
    create: {
      email: 'admin@bourcha.com',
      name: 'Administrateur',
      password: await bcrypt.hash('admin123', 10),
      roleId: adminRole.id,
      department: 'Direction',
    },
  })

  const managerUser = await prisma.user.upsert({
    where: { email: 'y.sebbar@bourcha.com' },
    update: {},
    create: {
      email: 'y.sebbar@bourcha.com',
      name: 'Sebbar Youness',
      password: await bcrypt.hash('manager123', 10),
      roleId: managerRole.id,
      department: 'DSI',
    },
  })

  const user1 = await prisma.user.upsert({
    where: { email: 'a.benali@bourcha.com' },
    update: {},
    create: {
      email: 'a.benali@bourcha.com',
      name: 'Ahmed Benali',
      password: await bcrypt.hash('user123', 10),
      roleId: userRole.id,
      department: 'Commercial',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'f.zriouil@bourcha.com' },
    update: {},
    create: {
      email: 'f.zriouil@bourcha.com',
      name: 'Fatima Zriouil',
      password: await bcrypt.hash('user123', 10),
      roleId: userRole.id,
      department: 'RH',
    },
  })

  // ===== ROOMS =====
  const room1 = await prisma.room.upsert({
    where: { name: 'Salle Innovation' },
    update: {},
    create: {
      name: 'Salle Innovation',
      description: 'Salle moderne équipée pour les réunions créatives et brainstorming.',
      capacity: 10,
      location: 'Bâtiment A',
      floor: '2ème étage',
      building: 'Siège',
      hasScreen: true,
      hasCamera: true,
      hasMicrophone: true,
      hasVideoConf: true,
      hasProjector: false,
      hasWhiteboard: true,
      requiresApproval: false,
      isActive: true,
      color: '#6366f1',
    },
  })

  const room2 = await prisma.room.upsert({
    where: { name: 'Salle Exécutive' },
    update: {},
    create: {
      name: 'Salle Exécutive',
      description: 'Salle de direction pour réunions stratégiques. Accès sur validation.',
      capacity: 8,
      location: 'Bâtiment A',
      floor: '3ème étage',
      building: 'Siège',
      hasScreen: true,
      hasCamera: true,
      hasMicrophone: true,
      hasVideoConf: true,
      hasProjector: true,
      hasWhiteboard: false,
      requiresApproval: true,
      isActive: true,
      color: '#0ea5e9',
    },
  })

  const room3 = await prisma.room.upsert({
    where: { name: 'Salle Atlas' },
    update: {},
    create: {
      name: 'Salle Atlas',
      description: 'Grande salle pour formations et présentations jusqu\'à 20 personnes.',
      capacity: 20,
      location: 'Bâtiment B',
      floor: '1er étage',
      building: 'Annexe',
      hasScreen: true,
      hasCamera: false,
      hasMicrophone: true,
      hasVideoConf: false,
      hasProjector: true,
      hasWhiteboard: true,
      requiresApproval: false,
      isActive: true,
      color: '#10b981',
    },
  })

  const room4 = await prisma.room.upsert({
    where: { name: 'Salle Focus' },
    update: {},
    create: {
      name: 'Salle Focus',
      description: 'Petite salle pour entretiens individuels et réunions en petit comité.',
      capacity: 4,
      location: 'Bâtiment A',
      floor: '2ème étage',
      building: 'Siège',
      hasScreen: false,
      hasCamera: false,
      hasMicrophone: false,
      hasVideoConf: false,
      hasProjector: false,
      hasWhiteboard: true,
      requiresApproval: false,
      isActive: true,
      color: '#f59e0b',
    },
  })

  // Affecter la Salle Exécutive au manager
  await prisma.roomManager.upsert({
    where: { roomId_userId: { roomId: room2.id, userId: managerUser.id } },
    update: {},
    create: { roomId: room2.id, userId: managerUser.id },
  })

  // ===== BOOKINGS (données demo) =====
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  const booking1 = await prisma.booking.create({
    data: {
      userId: managerUser.id,
      roomId: room1.id,
      title: 'Réunion équipe produit',
      date: today,
      startTime: '14:00',
      endTime: '15:30',
      participants: 8,
      status: 'CONFIRMED',
      notes: 'Présentation sprint Q1',
    },
  })

  const booking2 = await prisma.booking.create({
    data: {
      userId: user1.id,
      roomId: room2.id,
      title: 'Point direction',
      date: tomorrow,
      startTime: '09:00',
      endTime: '10:00',
      participants: 4,
      status: 'PENDING',
      needsVideoConf: true,
    },
  })

  const booking3 = await prisma.booking.create({
    data: {
      userId: user2.id,
      roomId: room3.id,
      title: 'Formation RH',
      date: dayAfter,
      startTime: '11:00',
      endTime: '12:00',
      participants: 12,
      status: 'CONFIRMED',
    },
  })

  const booking4 = await prisma.booking.create({
    data: {
      userId: managerUser.id,
      roomId: room4.id,
      title: 'Entretien individuel',
      date: yesterday,
      startTime: '10:00',
      endTime: '11:00',
      participants: 2,
      status: 'CANCELLED',
      cancelledAt: yesterday,
    },
  })

  console.log('✅ Seed terminé !')
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔐 COMPTES DE CONNEXION :')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👑 ADMIN     : admin@bourcha.com      / admin123')
  console.log('🛡️  MANAGER   : y.sebbar@bourcha.com   / manager123')
  console.log('👤 USER 1    : a.benali@bourcha.com   / user123')
  console.log('👤 USER 2    : f.zriouil@bourcha.com  / user123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
