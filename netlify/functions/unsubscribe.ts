// POST /api/unsubscribe
// Body: { token: string }  (UUID)
//
// Marca l'iscritto come unsubscribed=true sul Supabase.
// Sostituisce il workflow n8n "Newsletter — Unsubscribe".

import type { Context } from '@netlify/functions';
import { getSupabaseAdmin, jsonResponse } from './_lib';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (req: Request, _ctx: Context): Promise<Response> => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' });
  }

  const token = String(payload?.token ?? '').trim();
  if (!UUID_RE.test(token)) {
    return jsonResponse(400, { error: 'Invalid token' });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('unsubscribe_token', token)
    .eq('unsubscribed', false) // idempotente: se già disiscritta, no-op
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('unsubscribe update failed', error);
    return jsonResponse(500, { error: 'Database error' });
  }

  // Risposta sempre 200 indipendentemente dal fatto che il token esista o
  // sia già stato usato. Evita token-probing dall'esterno.
  return jsonResponse(200, { ok: true });
};

export const config = {
  path: '/api/unsubscribe',
};
