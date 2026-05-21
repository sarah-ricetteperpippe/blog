// POST /api/send-recipe
// Headers: Authorization: Bearer <SEND_RECIPE_TOKEN>
// Body: {
//   posts: Array<{
//     lang: "it" | "en" | "fr",
//     title: string,
//     description: string,
//     heroImage: string,    // assoluto o relativo a SITE_URL
//     url: string,
//   }>
// }
//
// Per ciascun post, recupera tutti gli iscritti attivi della stessa lingua
// e manda loro la notifica. Sostituisce il workflow n8n "Send recipe flow".
//
// Endpoint protetto da bearer token: chiamato da CI/CD o da uno script
// quando viene pubblicato un nuovo post.

import type { Context } from '@netlify/functions';
import {
  getSupabaseAdmin,
  getResend,
  jsonResponse,
  getSiteUrl,
  getFromEmail,
} from './_lib';
import { newPostEmail, type Lang, type NewPost } from '../../src/lib/email-templates';

const LANGS: readonly Lang[] = ['it', 'en', 'fr'];
const RESEND_BATCH_MAX = 100; // limite API Resend per batch.send

interface PostInput extends NewPost {
  lang: Lang;
}

interface SubscriberRow {
  email: string;
  nome: string;
  unsubscribe_token: string;
}

export default async (req: Request, _ctx: Context): Promise<Response> => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  // Auth: bearer token condiviso.
  const expected = process.env.SEND_RECIPE_TOKEN;
  if (!expected) {
    console.error('SEND_RECIPE_TOKEN missing on server');
    return jsonResponse(500, { error: 'Server misconfigured' });
  }
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token !== expected) {
    return jsonResponse(401, { error: 'Unauthorized' });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' });
  }

  const posts: PostInput[] = Array.isArray(payload?.posts) ? payload.posts : [];
  if (posts.length === 0) {
    return jsonResponse(400, { error: 'No posts provided' });
  }

  // Validazione minimale
  for (const p of posts) {
    if (
      !LANGS.includes(p.lang) ||
      typeof p.title !== 'string' ||
      typeof p.description !== 'string' ||
      typeof p.url !== 'string' ||
      typeof p.heroImage !== 'string'
    ) {
      return jsonResponse(400, { error: 'Invalid post entry', post: p });
    }
  }

  const supabase = getSupabaseAdmin();
  const siteUrl = getSiteUrl();
  const fromEmail = getFromEmail();
  const resend = getResend();

  const sentByLang: Record<Lang, number> = { it: 0, en: 0, fr: 0 };
  const failures: Array<{ post: string; lang: Lang; error: string }> = [];

  // Cache subscribers per lang per evitare query duplicate se più post
  // hanno la stessa lingua.
  const subsCache = new Map<Lang, SubscriberRow[]>();

  for (const post of posts) {
    let subs = subsCache.get(post.lang);
    if (!subs) {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('email, nome, unsubscribe_token')
        .eq('lang', post.lang)
        .eq('unsubscribed', false);
      if (error) {
        console.error('fetch subscribers failed', error);
        failures.push({ post: post.title, lang: post.lang, error: 'db_fetch' });
        continue;
      }
      subs = (data ?? []) as SubscriberRow[];
      subsCache.set(post.lang, subs);
    }

    if (subs.length === 0) continue;

    // Costruisce batch di email per Resend (max 100 per chiamata)
    const messages = subs.map((sub) => {
      const unsubscribeUrl = `${siteUrl}/${post.lang}/unsubscribe?token=${sub.unsubscribe_token}`;
      const envelope = newPostEmail(post.lang, {
        nome: sub.nome,
        post,
        unsubscribeUrl,
        fromEmail,
        siteUrl,
      });
      return {
        from: envelope.from,
        to: sub.email,
        subject: envelope.subject,
        html: envelope.html,
      };
    });

    for (let i = 0; i < messages.length; i += RESEND_BATCH_MAX) {
      const chunk = messages.slice(i, i + RESEND_BATCH_MAX);
      const { error: batchError } = await resend.batch.send(chunk);
      if (batchError) {
        console.error('resend batch failed', batchError);
        failures.push({
          post: post.title,
          lang: post.lang,
          error: 'resend_batch',
        });
      } else {
        sentByLang[post.lang] += chunk.length;
      }
    }
  }

  return jsonResponse(200, {
    ok: failures.length === 0,
    sent: sentByLang,
    failures,
  });
};

export const config = {
  path: '/api/send-recipe',
};
