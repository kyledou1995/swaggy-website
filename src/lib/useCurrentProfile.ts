'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

/**
 * Shared, cached profile of the signed-in user.
 *
 * Layouts read from this so the correct name/company renders immediately when
 * navigating between pages, instead of flashing placeholder values while each
 * page refetches. The cache lives in memory and sessionStorage (cleared on
 * logout or when a different account signs in).
 */

const STORAGE_KEY = 'merchin:profile';
let cachedProfile: User | null = null;
let hydratedFromStorage = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function readStorage() {
  if (hydratedFromStorage || typeof window === 'undefined') return;
  hydratedFromStorage = true;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) cachedProfile = JSON.parse(raw) as User;
  } catch {
    // storage unavailable
  }
}

function setCached(profile: User | null) {
  cachedProfile = profile;
  try {
    if (profile) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  readStorage();
  return cachedProfile;
}

function getServerSnapshot() {
  return null;
}

async function refresh() {
  const { data: { session } } = await supabase.auth.getSession();
  const authUser = session?.user;
  if (!authUser) {
    setCached(null);
    return;
  }
  if (cachedProfile && cachedProfile.id !== authUser.id) setCached(null); // different account

  const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
  if (data) setCached(data as User);
}

export function clearCachedProfile() {
  setCached(null);
}

export function useCurrentProfile() {
  const profile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    // Revalidate once per mount (deduped across components mounting together).
    if (!inflight) {
      inflight = refresh().finally(() => {
        inflight = null;
      });
    }
  }, []);

  return { profile };
}
