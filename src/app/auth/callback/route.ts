import { createClientWithCookies } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClientWithCookies(cookieStore);
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Verificar si ya existe un perfil para este usuario
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      // Si no existe perfil, crearlo (primera vez con Google)
      if (!existingProfile && user.email) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0] || 'Usuario',
            email: user.email,
            avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            email_confirmed: true, // Google ya verificó el email
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
    }

    // Redirigir a /app después del login exitoso
    return NextResponse.redirect(`${origin}/app`);
  }

  // Si no hay código, redirigir a login
  return NextResponse.redirect(`${origin}/login`);
}
