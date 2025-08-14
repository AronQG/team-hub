import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Добавляем заголовки безопасности
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Защита от CSRF для API endpoints
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const method = request.method
    if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
      const origin = request.headers.get('origin')
      
      // Проверяем, что запрос пришел с того же домена или разрешенных источников
      if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || []
        if (!allowedOrigins.includes(origin)) {
          return new NextResponse('Forbidden', { status: 403 })
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
