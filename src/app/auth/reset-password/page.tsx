'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  // The reset link signs the user in with a temporary recovery session.
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.slice(1));
      const linkErr = url.searchParams.get('error_description') || hash.get('error_description');
      if (linkErr) {
        setLinkError(linkErr);
        return;
      }

      const code = url.searchParams.get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError && !cancelled) {
          setLinkError(exchangeError.message);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) setReady(true);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) setReady(true);
    });

    init();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/portal/dashboard'), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <span className="text-3xl font-bold text-gray-900 tracking-tight">
              merchin<span className="text-emerald-500">.</span>
            </span>
          </a>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Choose a new password</h1>
            <p className="mt-2 text-gray-600">Enter a new password for your Merchin account.</p>
          </div>

          {linkError ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  This reset link is invalid or has expired. Please request a new one.
                </p>
              </div>
              <div className="text-center">
                <Link href="/auth/forgot-password" className="text-green-600 hover:text-green-700 font-medium text-sm">
                  Send a new reset link
                </Link>
              </div>
            </div>
          ) : done ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">Your password has been updated. Taking you to your dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              {!ready && (
                <p className="text-sm text-gray-500 text-center">Verifying your reset link…</p>
              )}
              <Input
                label="New password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!ready || isLoading}
                minLength={8}
                required
              />
              <Input
                label="Confirm new password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={!ready || isLoading}
                required
              />
              <Button type="submit" variant="primary" size="md" isLoading={isLoading} disabled={!ready} className="w-full">
                Update Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
