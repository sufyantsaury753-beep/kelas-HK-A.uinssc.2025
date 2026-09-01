import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xjpkfdalokarxmbousvj.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqcGtmZGFsb2thcnhtYm91c3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTM3MjksImV4cCI6MjEwMzU2OTcyOX0.ukLS09nUcqYzn9soXrNwngYRfK7hFPnzlH0wkOR69l8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));
};
