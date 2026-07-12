import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

export async function createClient() {
  const cookieStore = await cookies()
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sanitizedUrl = sanitizeUrl(originalUrl);

  return createServerClient(
    sanitizedUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

