import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',       type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { role: true },
        })

        if (!user || !user.isActive) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!passwordMatch) return null

        return {
          id:         user.id,
          email:      user.email,
          name:       user.name,
          firstName:  user.firstName  ?? '',
          lastName:   user.lastName   ?? '',
          role:       user.role.name,
          roleLabel:  user.role.label,
          department: user.department,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id         = user.id
        token.role       = (user as any).role
        token.roleLabel  = (user as any).roleLabel
        token.department = (user as any).department
        token.firstName  = (user as any).firstName
        token.lastName   = (user as any).lastName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id                    = token.id as string
        ;(session.user as any).role        = token.role
        ;(session.user as any).roleLabel   = token.roleLabel
        ;(session.user as any).department  = token.department
        ;(session.user as any).firstName   = token.firstName
        ;(session.user as any).lastName    = token.lastName
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 heures
  },
  secret: process.env.NEXTAUTH_SECRET,
})
