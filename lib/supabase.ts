import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbukbnmgkmjyfesaqqjq.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RPzJKQTZrXUxYXHFxJLXPQ_n2xttLRB';

let supabase: SupabaseClient;

try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };
