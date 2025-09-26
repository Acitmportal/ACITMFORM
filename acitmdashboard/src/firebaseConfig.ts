// This file is now used for Supabase configuration.
import { createClient } from '@supabase/supabase-js';

// Use Vercel Environment Variables for Supabase credentials.
// These must be set in your Vercel project settings:
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.error("Supabase URL is not set. Make sure VITE_SUPABASE_URL is defined in your environment variables.");
    throw new Error("Supabase URL is not configured.");
}
if (!supabaseAnonKey) {
    console.error("Supabase Anon Key is not set. Make sure VITE_SUPABASE_ANON_KEY is defined in your environment variables.");
    throw new Error("Supabase Anon Key is not configured.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
