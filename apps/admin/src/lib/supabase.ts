import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJ_placeholder';
export const supabase = createClient(url, key, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } });
export const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
