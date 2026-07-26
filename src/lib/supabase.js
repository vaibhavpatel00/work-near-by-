import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bnobhzhmvpufiymjefln.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ShH47YB2Z5OtSEaSbRnRuQ_uteGfwVX';

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
  console.error('Supabase init failed:', e);
  // Create a minimal mock so the app doesn't crash
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => { throw new Error('Supabase not configured'); },
      signInWithOtp: async () => { throw new Error('Supabase not configured'); },
      verifyOtp: async () => { throw new Error('Supabase not configured'); },
      signUp: async () => { throw new Error('Supabase not configured'); },
      signOut: async () => {},
      updateUser: async () => { throw new Error('Supabase not configured'); },
    },
    from: () => ({
      select: () => ({ order: async () => ({ data: [], error: null }), eq: () => ({ data: [], error: null }) }),
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
    }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
    removeChannel: () => {},
  };
}

export { supabase };
