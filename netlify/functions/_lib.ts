// Helpers condivisi per le Netlify Functions di Ricette per Pippe.
// File con prefisso "_" → non viene deployato come function, è solo libreria.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

let _supabase: SupabaseClient | null = null;
let _resend: Resend | null = null;

/**
 * Supabase client server-side con service_role key (bypassa RLS).
 * Usare SOLO dentro alle Netlify Functions, mai shippare in client bundle.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabase) return _supabase;
  const url =
    process.env.SUPABASE_URL ??
    process.env.PUBLIC_SUPABASE_URL; // fallback: stessa URL della publishable
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase env vars missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)',
    );
  }
  _supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _supabase;
}

/** Client Resend (lazy init). */
export function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY missing');
  _resend = new Resend(key);
  return _resend;
}

/** Risposta JSON standard. */
export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Site URL canonico per email (unsubscribe link, immagini). */
export function getSiteUrl(): string {
  return (
    process.env.SITE_URL ??
    process.env.PUBLIC_SITE_URL ??
    'https://ricetteperpippe.com'
  ).replace(/\/$/, '');
}

/** Sender Resend (mittente verificato o onboarding di default). */
export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
}
