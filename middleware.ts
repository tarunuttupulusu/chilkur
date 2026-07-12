import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

function sanitizeUrl(url: string | undefined): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/^['"]|['"]$/g, '');
  
  // Fix cases where a colon is missing after http/https at the start
  cleaned = cleaned.replace(/^(https?)\/\/+/i, '$1://');
  cleaned = cleaned.replace(/^(https?):?\/\/+/i, '$1://');
  
  // If concatenated multiple times (e.g. https://...https://... or https://...https//...)
  if ((cleaned.match(/https?:\/\//gi) || []).length > 1 || cleaned.includes('https//') || cleaned.includes('http//')) {
    const parts = cleaned.split(/(?=https?:?\/\/)/i);
    for (const part of parts) {
      let trimmed = part.trim();
      trimmed = trimmed.replace(/^(https?):?\/\/+/i, '$1://');
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        cleaned = trimmed;
        break;
      }
    }
  }

  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sanitizedUrl = sanitizeUrl(originalUrl);

  // Create a supabase client specifically for middleware
  const supabase = createServerClient(
    sanitizedUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {

      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginRoute = request.nextUrl.pathname === '/admin/login'

  if (isAdminRoute && !isLoginRoute && !session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/admin/login'
    return NextResponse.redirect(redirectUrl)
  }

  if (isLoginRoute && session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/admin'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
