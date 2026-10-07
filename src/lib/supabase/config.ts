// =============================================================================
// AI Radar — Database Configuration Guard
// =============================================================================
// Checks whether Supabase environment variables are configured.
// Used throughout the app to show appropriate empty/unavailable states
// without throwing unhandled errors.
// =============================================================================

/**
 * Returns true if Supabase URL and anon key are configured with real values.
 * Returns false if placeholders are present or variables are missing.
 */
export function isDatabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return false;
  if (url.includes('your-project-id')) return false;
  if (key.includes('your-supabase')) return false;
  if (url === 'https://your-project-id.supabase.co') return false;

  return true;
}

/**
 * Returns true if the service role key is configured with a real value.
 * Only used server-side in trusted contexts.
 */
export function isServiceKeyConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return false;
  if (key.includes('your-supabase')) return false;
  return true;
}
