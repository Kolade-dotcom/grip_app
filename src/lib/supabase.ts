import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (with service role for admin operations)
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createClient(url, key);
}

// Client-side Supabase client (with anon key for browser usage)
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase client environment variables");
  }

  return createClient(url, key);
}
