import { NextResponse } from 'next/server';

export async function GET(req) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  const state = Math.random().toString(36).slice(2);
  // Optionally persist state in cookie/session for verification in callback

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid email profile w_member_social',
    state,
  });

  const url = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

  return NextResponse.redirect(url);
}
