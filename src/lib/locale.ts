import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Locale } from '@/i18n/navigation';

export async function getUserLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('locale')
      .eq('id', user.id)
      .single() as { data: { locale?: string } | null };
    
    if (profile?.locale) {
      return profile.locale as Locale;
    }
  }
  
  const localeCookie = cookieStore.get('NEXT_LOCALE');
  return (localeCookie?.value as Locale) || 'es';
}

export async function setUserLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
}

export function detectBrowserLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return 'es';
  
  const languages = acceptLanguage.split(',').map(lang => {
    const [locale] = lang.trim().split(';');
    return locale.split('-')[0];
  });
  
  if (languages.includes('en')) return 'en';
  return 'es';
}
