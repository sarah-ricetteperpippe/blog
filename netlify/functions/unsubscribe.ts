// POST /api/unsubscribe
// Body: { token: string }  (UUID)
//
// Marca l'iscritto come unsubscribed=true sul Supabase, poi manda una mail
// di conferma cancellazione nella lingua dell'iscritto.
// Sostituisce il workflow n8n "Newsletter — Unsubscribe".

import type { Context } from '@netlify/functions';
import {
  getSupabaseAdmin,
  getResend,
  jsonResponse,
  getSiteUrl,
  getFromEmail,
} from './_lib';
import {
  unsubscribeConfirmEmail,
  type Lang,
} from '../../src/lib/email-templates';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LANGS: readonly Lang[] = ['it', 'en', 'fr'];

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
    .select('email, nome, lang')
    .maybeSingle();

  if (error) {
    console.error('unsubscribe update failed', error);
    return jsonResponse(500, { error: 'Database error' });
  }

  // Se data è null vuol dire che il token non esiste oppure era già usato.
  // Rispondiamo 200 in entrambi i casi (idempotente) per evitare token-probing.
  if (!data) {
    return jsonResponse(200, { ok: true, alreadyUnsubscribed: true });
  }

  // Mail di conferma. Non-fatale: la disiscrizione è già salvata sul DB.
  try {
    const lang = LANGS.includes(data.lang as Lang)
      ? (data.lang as Lang)
      : 'it';
    const envelope = unsubscribeConfirmEmail(lang, {
      nome: data.nome,
      fromEmail: getFromEmail(),
      siteUrl: getSiteUrl(),
    });
    const resend = getResend();
    const { error: sendError } = await resend.emails.send({
      from: envelope.from,
      to: data.email,
      subject: envelope.subject,
      html: envelope.html,
    });
    if (sendError) {
      console.error('unsubscribe confirm email failed', sendError);
      return jsonResponse(200, { ok: true, warning: 'email_send_failed' });
    }
  } catch (err) {
    console.error('unsubscribe confirm email exception', err);
    return jsonResponse(200, { ok: true, warning: 'email_send_failed' });
  }

  return jsonResponse(200, { ok: true });
};

export const config = {
  path: '/api/unsubscribe',
};
