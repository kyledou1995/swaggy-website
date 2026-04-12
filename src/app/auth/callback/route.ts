import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle error params from Supabase (e.g. expired link)
  if (error) {
    const params = new URLSearchParams({ error: errorDescription || error });
    return NextResponse.redirect(new URL(`/auth/verify-expired?${params}`, requestUrl.origin));
  }

  if (code) {
    const supabase = createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const params = new URLSearchParams({ error: exchangeError.message });
      return NextResponse.redirect(new URL(`/auth/verify-expired?${params}`, requestUrl.origin));
    }
  }

  // Redirect to the portal dashboard after successful verification
  return NextResponse.redirect(new URL('/portal/dashboard', requestUrl.origin));
}
