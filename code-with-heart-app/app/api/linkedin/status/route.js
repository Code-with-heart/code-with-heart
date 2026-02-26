import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchLinkedInProfile } from '@/utils/linkedin';

export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ connected: false });
    }

    const { data, error } = await supabase
      .from('linkedin_accounts')
      .select('id, provider_user_id, access_token, created_at')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ connected: false, account: null });
    }

    let email = null;
    let picture = null;
    try {
      const profile = await fetchLinkedInProfile(data.access_token);
      email = profile.email || null;
      picture = profile.picture || null;
    } catch (e) {
      console.error('Failed to fetch LinkedIn profile for email:', e);
    }

    return NextResponse.json({ connected: true, account: { id: data.id, provider_user_id: data.provider_user_id, created_at: data.created_at, email, picture } });
  } catch (err) {
    console.error('LinkedIn status route error:', err);
    return NextResponse.json({ connected: false, account: null }, { status: 500 });
  }
}
