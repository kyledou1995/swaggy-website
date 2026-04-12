import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Client-side Supabase client
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Named export for compatibility
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

// Server-side Supabase client
export function createServerClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}
