import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { refreshAccessToken, createShare } from '@/utils/linkedin';

export async function POST(req) {
  try {
    const body = await req.json();
    const feedbackId = body.feedbackId;
    const customText = body.customText || null;
    if (!feedbackId) return NextResponse.json({ error: 'Missing feedbackId' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Verify feedback belongs to this recipient
    const { data: feedback } = await supabase.from('feedback').select('*').eq('id', feedbackId).single();
    if (!feedback) return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    if (feedback.recipient_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Load linkedin account
    const { data: account } = await supabase.from('linkedin_accounts').select('*').eq('user_id', user.id).single();
    if (!account) {
      return NextResponse.json({ error: 'LinkedIn account not connected', connected: false }, { status: 402 });
    }

    let accessToken = account.access_token;
    const now = new Date();
    if (account.expires_at && new Date(account.expires_at) <= now && account.refresh_token) {
      // attempt refresh
      try {
        const refreshed = await refreshAccessToken(account.refresh_token);
        accessToken = refreshed.access_token;
        const expiresAt = refreshed.expires_in ? new Date(Date.now() + Number(refreshed.expires_in) * 1000).toISOString() : null;
        await supabase.from('linkedin_accounts').update({ access_token: accessToken, expires_at: expiresAt }).eq('user_id', user.id);
      } catch (refreshErr) {
        console.error('Failed to refresh LinkedIn token', refreshErr);
        return NextResponse.json({ error: 'Failed to refresh LinkedIn token' }, { status: 500 });
      }
    }

    // Create LinkedIn share
    console.log('LinkedIn account data:', account);
    
    if (!account.provider_user_id || account.provider_user_id === 'null') {
      console.error('LinkedIn member ID is missing or null:', account.provider_user_id);
      return NextResponse.json({ error: 'LinkedIn member ID not found. Please reconnect your LinkedIn account.' }, { status: 500 });
    }
    
    // LinkedIn requires 'urn:li:person:' format for UGC Posts API
    const authorUrn = account.provider_user_id.startsWith('urn:') 
      ? account.provider_user_id 
      : `urn:li:person:${account.provider_user_id}`;
    
    console.log('Using author URN:', authorUrn);
    const text = customText || feedback.modified_text || feedback.original_text || '';

    try {
      await createShare(accessToken, authorUrn, text);

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('LinkedIn publish error:', err);
      return NextResponse.json({ error: err.message || 'Publish failed' }, { status: 500 });
    }
  } catch (err) {
    console.error('Publish route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
