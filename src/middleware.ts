import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Not authenticated → redirect to login
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = token.role as string

  // Historique global: admin + manager
  if (pathname.startsWith('/admin/bookings')) {
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // All other /admin/* routes: admin only
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Manager + admin only: /validate
  if (pathname.startsWith('/validate')) {
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bookings/:path*',
    '/rooms/:path*',
    '/pending/:path*',
    '/validate/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
}
