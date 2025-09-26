// This file is now used for Supabase configuration.
import { createClient } from '@supabase/supabase-js';

// The user has provided their Supabase credentials to connect the app.
const supabaseUrl = "https://jeritopknpbbzspkshdq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Implcml0b3BrbnBiYnpzcGtzaGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODg1ODcsImV4cCI6MjA3NDQ2NDU4N30.Jm4MPSXjc5fS8F1sPBOY-P0NoUip_o7evVngjTX0k5w";

if (!supabaseUrl) {
    console.error("Supabase URL is not set.");
    throw new Error("Supabase URL is not configured.");
}
if (!supabaseAnonKey) {
    console.error("Supabase Anon Key is not set.");
    throw new Error("Supabase Anon Key is not configured.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);