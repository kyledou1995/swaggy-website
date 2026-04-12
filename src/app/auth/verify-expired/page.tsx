'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase';

export default function VerifyExpiredPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <VerifyExpiredContent />
    </Suspense>
  );
}

function VerifyExpiredContent() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('error') || 'Your verification link has expired.';

  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSending(true);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (resendError) {
        setError(resendError.message);
        setIsSending(false);
        return;
      }

      setSent(true);
      setIsSending(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <span className="text-3xl font-bold text-gray-900 tracking-tight">
              swaggy<span className="text-emerald-500">.</span>
            </span>
          </a>
        </div>

        {sent ? (
          <div className="space-y-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">New link sent!</h1>
            <p className="text-gray-600">
              We&apos;ve sent a fresh verification link to <span className="font-semibold text-gray-900">{email}</span>. Check your inbox and click the link to verify your account.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-800">
                Don&apos;t forget to check your spam folder if you don&apos;t see it.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="inline-block text-emerald-600 hover:text-emerald-700 font-medium text-sm"
            >
              Go to Log In
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Link expired</h1>
              <p className="mt-3 text-gray-600">{errorMessage}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 text-center">
                No worries — enter your email below and we&apos;ll send you a new verification link right away.
              </p>
            </div>

            <form onSubmit={handleResend} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSending}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSending}
                className="w-full"
              >
                Send New Verification Link
              </Button>
            </form>

            <div className="text-center text-sm space-y-2">
              <div>
                <span className="text-gray-600">Remember your password? </span>
                <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Log in
                </Link>
              </div>
              <div>
                <span className="text-gray-600">Need a new account? </span>
                <Link href="/auth/signup" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
