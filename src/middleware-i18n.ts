import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, type Locale } from '@/i18n/navigation';

function detectBrowserLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  
  const languages = acceptLanguage.split(',').map(lang => {
    const [locale] = lang.trim().split(';');
    return locale.split('-')[0];
  });
  
  if (languages.includes('en')) return 'en';
  return 'es';
}

export async function handleLocale(request: NextRequest, supabaseResponse: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  let locale: Locale = defaultLocale;
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('locale')
      .eq('id', user.id)
      .single() as { data: { locale?: string } | null };
    
    if (profile?.locale) {
      locale = profile.locale as Locale;
    }
  } else {
    const existingLocaleCookie = request.cookies.get('NEXT_LOCALE');
    if (existingLocaleCookie) {
      locale = existingLocaleCookie.value as Locale;
    } else {
      const acceptLanguage = request.headers.get('accept-language');
      locale = detectBrowserLocale(acceptLanguage);
    }
  }

  supabaseResponse.cookies.set('NEXT_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  return supabaseResponse;
}
