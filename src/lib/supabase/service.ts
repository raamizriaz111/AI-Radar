// =============================================================================
// AI Radar — Supabase Service Client (privileged server-side operations)
// =============================================================================
// Uses SUPABASE_SERVICE_ROLE_KEY — bypasses Row Level Security.
//
// USE THIS ONLY FOR:
//   - Phase 3 collectors writing new items
//   - Creating user profiles on sign-up
//   - Collection run management
//   - Admin/diagnostic operations
//
// NEVER:
//   - Import this in client components ('use client')
//   - Expose SUPABASE_SERVICE_ROLE_KEY to the browser
//   - Use this for user-facing read queries (use server.ts instead)
// =============================================================================

import { createClient } from '@supabase/supabase-js';
import { type Database } from '@/lib/database.types';

/**
 * Creates a privileged Supabase client that bypasses Row Level Security.
 * Only for server-side use in trusted contexts.
 *
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not set
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not configured. ' +
      'Set these in .env.local. Never commit real credentials.'
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
