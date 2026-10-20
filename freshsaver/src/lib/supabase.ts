import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseAnonKey && 
                    !supabaseUrl.includes('your_supabase_project_url') && 
                    !supabaseAnonKey.includes('your_supabase_anon_key');

const mockClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ data: null, error: null }),
      signUp: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      signInWithPassword: async () => ({ data: { session: null }, error: { message: 'Supabase not configured' } }),
      onAuthStateChange: () => ({ 
        data: { 
          subscription: { unsubscribe: () => {} } 
        } 
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        }),
      }),
      insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      update: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        }),
      }),
    }),
};

export const supabase = (isConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : mockClient) as SupabaseClient;

if (!isConfigured) {
  console.warn(
    'Supabase not configured: Missing or placeholder environment variables. Using mock client. Please check your .env file.'
  );
}
