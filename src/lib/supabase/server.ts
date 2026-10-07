// =============================================================================
// AI Radar — Supabase Client (server components & route handlers)
// =============================================================================
// Uses @supabase/ssr to create a server-side client that reads cookies
// for the authenticated session. Still uses anon key + RLS.
//
// For privileged operations (writing items, running collectors), use
// createServiceClient() from service.ts — NEVER in client components.
// =============================================================================

import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { type Database } from '@/lib/database.types';

export async function createClient() {
  try {
    const cookieStore = await cookies();

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // setAll is called from Server Components where cookies cannot be set.
            }
          },
        },
      }
    );
  } catch {
    // Outside a Next.js request scope (e.g. background collection, cron, scripts, tests)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createSupabaseClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
}
