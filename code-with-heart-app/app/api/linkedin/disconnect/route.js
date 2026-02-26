import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { error } = await supabase
      .from('linkedin_accounts')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Disconnect error:', error);
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({ disconnected: true });
  } catch (err) {
    console.error('Disconnect route error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
