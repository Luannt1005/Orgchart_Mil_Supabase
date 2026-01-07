/**
 * Supabase Client Configuration
 * 
 * This replaces the previous Firebase configuration.
 * - supabase: Client-side usage (browser)
 * - supabaseAdmin: Server-side usage (API routes) - has elevated privileges
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Browser/Client-side Supabase client
 * Uses anon key - respects Row Level Security (RLS)
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

/**
 * Server-side Supabase client (for API routes)
 * Uses service role key - bypasses Row Level Security
 * ⚠️ ONLY use in server-side code (API routes, server components)
 */
export const supabaseAdmin: SupabaseClient = createClient(
    supabaseUrl,
    supabaseServiceRoleKey || supabaseAnonKey,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    }
);

/**
 * Helper function to check if we're on server-side
 */
export const isServer = typeof window === 'undefined';

/**
 * Get the appropriate Supabase client based on environment
 */
export function getSupabaseClient(): SupabaseClient {
    return isServer ? supabaseAdmin : supabase;
}

// Export types for convenience
export type { SupabaseClient };
