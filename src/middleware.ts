// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
export async function middleware(request: NextRequest) {

  const BACKEND_API_URL =`http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/user/me`



  const { pathname } = request.nextUrl
  // Allow open access to these paths
  if (
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/unauthorized')
  ) {
    return NextResponse.next()
  }
  // Call your FastAPI backend to validate the session
  const res = await fetch(BACKEND_API_URL, {
    headers: {
      Cookie: request.headers.get('cookie') || '',
    },
    credentials: 'include',
  })

  
  if (res.status !== 200) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  const user = await res.json()
  // Role-based protection
  if (pathname.startsWith('/admin_dashboard') && user.data.role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }
  if (pathname.startsWith('/super_admin_dashboard') && user.data.role !== 'superadmin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }
  return NextResponse.next()
}
