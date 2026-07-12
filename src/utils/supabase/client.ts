import { createBrowserClient } from '@supabase/ssr'

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

export function createClient() {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sanitizedUrl = sanitizeUrl(originalUrl);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[Supabase Client Client-Side Init]');
  console.log('- Raw URL from env:', originalUrl);
  console.log('- Sanitized URL used:', sanitizedUrl);
  console.log('- Env Loaded Status:', !!originalUrl && !!anonKey);
  console.log('- Is Valid URL Scheme:', /^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(sanitizedUrl));

  return createBrowserClient(
    sanitizedUrl,
    anonKey!
  )
}

