import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  console.warn("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

const finalUrl = supabaseUrl || "https://dummy-url.supabase.co";
const finalKey = supabaseAnonKey || "dummy-key";

// Client for public/browser usage (subject to RLS)
export const supabase = createClient(finalUrl, finalKey);

// Admin client for server-side API routes (bypasses RLS)
export const supabaseAdmin = createClient(finalUrl, supabaseServiceKey || finalKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
