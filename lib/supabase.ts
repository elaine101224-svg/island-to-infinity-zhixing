import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbukbnmgkmjyfesaqqjq.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RPzJKQTZrXUxYXHFxJLXPQ_n2xttLRB';

// This module is only imported by server-side API routes. When a service-role
// key is configured (server-only, never exposed to the browser) we use it so
// the app keeps working after Row Level Security is enabled — RLS blocks the
// anon key but the service role bypasses it. Falls back to the anon key so
// nothing breaks before the key is set.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const key = serviceRoleKey || anonKey;

const supabase: SupabaseClient = createClient(supabaseUrl, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export { supabase };
