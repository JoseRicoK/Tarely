import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function PATCH(request: Request) {
  try {
    const { locale } = await request.json();
    
    if (!locale || !['es', 'en'].includes(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await (supabase
      .from('profiles') as any)
      .update({ locale })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating locale:', error);
      return NextResponse.json(
        { error: 'Failed to update locale' },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('NEXT_LOCALE', locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });

    return NextResponse.json({ success: true, locale });
  } catch (error) {
    console.error('Error in locale API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('locale')
      .eq('id', user.id)
      .single() as { data: { locale?: string } | null };

    const locale = profile?.locale || 'es';

    return NextResponse.json({ locale });
  } catch (error) {
    console.error('Error getting locale:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
