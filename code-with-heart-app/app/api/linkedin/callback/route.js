import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { exchangeCodeForToken, fetchLinkedInProfile } from '@/utils/linkedin';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const tokenData = await exchangeCodeForToken(code, process.env.LINKEDIN_REDIRECT_URI);
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;
    const expiresIn = tokenData.expires_in ? Number(tokenData.expires_in) : null;
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    const profile = await fetchLinkedInProfile(accessToken);
    
    // Use 'sub' from OIDC userinfo as the member identifier
    const providerUserId = profile.sub || profile.id || null;

    if (!providerUserId) {
      console.error('No LinkedIn member ID found in profile:', profile);
      return NextResponse.json({ error: 'Could not get LinkedIn member ID from profile' }, { status: 500 });
    }

    // Persist tokens to linkedin_accounts for the currently signed-in user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Upsert into linkedin_accounts
    const { error: upsertError } = await supabase
      .from('linkedin_accounts')
      .upsert({ 
        user_id: user.id, 
        provider_user_id: providerUserId,
        access_token: accessToken, 
        refresh_token: refreshToken, 
        expires_at: expiresAt,
        scopes: 'openid email profile w_member_social'
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('LinkedIn account upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to save LinkedIn account: ' + upsertError.message }, { status: 500 });
    }

    // Redirect back to settings
    return NextResponse.redirect(new URL('/settings?linkedin_connected=true', req.url));
  } catch (err) {
    console.error('LinkedIn callback error:', err);
    return NextResponse.json({ error: err.message || 'Callback error' }, { status: 500 });
  }
}
