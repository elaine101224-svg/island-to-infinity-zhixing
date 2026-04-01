import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jbukbnmgkmjyfesaqqjq.supabase.co';
const supabaseKey = 'sb_publishable_RPzJKQTZrXUxYXHFxJLXPQ_n2xttLRB';

export const supabase = createClient(supabaseUrl, supabaseKey);
