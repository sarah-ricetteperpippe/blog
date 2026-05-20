// POST /api/subscribe
// Body: { nome: string, email: string, lang: "it" | "en" | "fr" }
//
// Salva l'iscritto su Supabase (newsletter_subscribers) e manda la welcome
// email via Resend nella lingua corrispondente.
// Sostituisce il workflow n8n "Subscription flow".

import type { Context } from '@netlify/functions';
import {
  getSupabaseAdmin,
  getResend,
  jsonResponse,
  getSiteUrl,
  getFromEmail,
} from './_lib';
import { welcomeEmail, type Lang } from '../../src/lib/email-templates';

const LANGS: readonly Lang[] = ['it', 'en', 'fr'];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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

  const nome = String(payload?.nome ?? '').trim();
  const email = String(payload?.email ?? '').trim().toLowerCase();
  const lang = String(payload?.lang ?? '').trim() as Lang;

  if (!nome || nome.length > 100) {
    return jsonResponse(400, { error: 'Invalid nome' });
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return jsonResponse(400, { error: 'Invalid email' });
  }
  if (!LANGS.includes(lang)) {
    return jsonResponse(400, { error: 'Invalid lang' });
  }

  const supabase = getSupabaseAdmin();

  // Insert. L'indice parziale unique impedisce doppie iscrizioni attive
  // sulla stessa (email, lang). Se è già iscritta restituiamo 200 ok senza
  // ri-mandare la welcome email (evita spam).
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert({ nome, email, lang })
    .select('unsubscribe_token')
    .single();

  if (error) {
    if ((error as any).code === '23505') {
      // unique_violation = già iscritta attiva
      return jsonResponse(200, { ok: true, alreadySubscribed: true });
    }
    console.error('subscribe insert failed', error);
    return jsonResponse(500, { error: 'Database error' });
  }

  // Send welcome email. Non-fatal se fallisce: l'iscrizione è già salvata.
  try {
    const envelope = welcomeEmail(lang, {
      nome,
      fromEmail: getFromEmail(),
      siteUrl: getSiteUrl(),
    });
    const resend = getResend();
    const { error: sendError } = await resend.emails.send({
      from: envelope.from,
      to: email,
      subject: envelope.subject,
      html: envelope.html,
    });
    if (sendError) {
      console.error('welcome email failed', sendError);
      return jsonResponse(200, { ok: true, warning: 'email_send_failed' });
    }
  } catch (err) {
    console.error('welcome email exception', err);
    return jsonResponse(200, { ok: true, warning: 'email_send_failed' });
  }

  return jsonResponse(200, { ok: true });
};

export const config = {
  path: '/api/subscribe',
};
