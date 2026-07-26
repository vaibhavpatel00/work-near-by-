import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bnobhzhmvpufiymjefln.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ShH47YB2Z5OtSEaSbRnRuQ_uteGfwVX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
