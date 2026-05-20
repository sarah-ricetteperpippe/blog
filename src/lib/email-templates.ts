// Template email per Ricette per Pippe.
// Porting fedele dei 3 workflow n8n (Subscription, Send recipe) in TS,
// così le Netlify Functions possono usarli senza dipendere da n8n.
//
// API esposta:
//   welcomeEmail(lang, opts)  -> email di benvenuto dopo subscribe
//   newPostEmail(lang, opts)  -> notifica nuovo articolo agli iscritti
//
// Entrambe ritornano { from, subject, html } pronto per resend.emails.send().

export type Lang = 'it' | 'en' | 'fr';

export interface EmailEnvelope {
  from: string;
  subject: string;
  html: string;
}

const BRAND = {
  it: {
    fromName: 'Ricette per Pippe',
    siteName: 'Ricette per Pippe',
    tagline: "...if it's listed, it's tasted!",
    welcomeSubject: 'Benvenutə in Ricette per Pippe! 🌸',
    newPostPrefix: 'Nuovo articolo: ',
  },
  en: {
    fromName: 'Clueless Cooks',
    siteName: 'Clueless Cooks',
    tagline: "...if it's listed, it's tasted!",
    welcomeSubject: 'Welcome to Recipes for Clueless Cooks! 🌸',
    newPostPrefix: 'New post: ',
  },
  fr: {
    fromName: 'Recettes pour Quiches',
    siteName: 'Recettes pour Quiches',
    tagline: "...si c'est listé, c'est goûté !",
    welcomeSubject: 'Bienvenue chez Recettes pour Quiches! 🌸',
    newPostPrefix: 'Nouvel article : ',
  },
} as const;

// ---------- WELCOME EMAIL ---------------------------------------------

const WELCOME_COPY = {
  it: {
    greeting: (nome: string) => `Ciao <strong>${escapeHtml(nome)}</strong>! 🎉`,
    p1: 'Sono felicissima di averti qui.',
    p2: "Da oggi riceverai un'email ogni volta che pubblico una nuova ricetta — testate e approvate da una pippa vera, quindi a prova di disastro.",
    p3: "Nel frattempo dai un'occhiata a tutto quello che c'è già sul blog:",
    cta: 'Vai al blog →',
    sign: 'A presto in cucina,<br><strong>Sarah 🐱</strong>',
    footer:
      'Hai ricevuto questa mail perché ti sei iscritta su ricetteperpippe.it.<br>Per cancellarti rispondi a questa email con "cancellami".',
  },
  en: {
    greeting: (nome: string) => `Hi <strong>${escapeHtml(nome)}</strong>! 🎉`,
    p1: 'So happy to have you here.',
    p2: "From now on you'll get an email every time I publish a new recipe — tested and approved by a certified kitchen klutz, so disaster-proof by design.",
    p3: 'In the meantime, explore everything already on the blog:',
    cta: 'Go to the blog →',
    sign: 'See you in the kitchen,<br><strong>Sarah 🐱</strong>',
    footer:
      'You received this email because you signed up on ricetteperpippe.it.<br>To unsubscribe reply to this email with "unsubscribe".',
  },
  fr: {
    greeting: (nome: string) => `Bonjour <strong>${escapeHtml(nome)}</strong> ! 🎉`,
    p1: 'Trop contente de vous avoir ici.',
    p2: "Vous recevrez désormais un email à chaque nouvelle recette publiée — testée et approuvée par une vraie quiche en cuisine, donc à l'épreuve des catastrophes.",
    p3: 'En attendant, découvrez tout ce qui est déjà sur le blog :',
    cta: 'Aller au blog →',
    sign: 'À bientôt en cuisine,<br><strong>Sarah 🐱</strong>',
    footer:
      'Vous avez reçu cet email car vous vous êtes inscrite sur ricetteperpippe.it.<br>Pour vous désabonner, répondez à cet email avec "désabonnement".',
  },
} as const;

export function welcomeEmail(
  lang: Lang,
  opts: { nome: string; fromEmail: string; siteUrl: string },
): EmailEnvelope {
  const b = BRAND[lang];
  const c = WELCOME_COPY[lang];
  const logoUrl = `${opts.siteUrl.replace(/\/$/, '')}/logo-pippe.png`;

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<body style="margin:0;padding:0;background:#f9f5f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #1D0E03;">
        <tr>
          <td align="center" style="padding:28px 32px 20px;border-bottom:1px solid #1D0E03;">
            <img src="${logoUrl}" alt="${escapeHtml(b.siteName)}" width="80" style="display:block;margin:0 auto 10px;" />
            <div style="font-size:26px;color:#598D38;font-family:Georgia,serif;font-style:italic;font-weight:bold;">${escapeHtml(b.siteName)}</div>
            <div style="font-size:13px;color:#E76E51;font-style:italic;margin-top:4px;">${escapeHtml(b.tagline)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="font-size:16px;color:#1D0E03;line-height:1.6;margin:0 0 16px;">${c.greeting(opts.nome)}</p>
            <p style="font-size:16px;color:#1D0E03;line-height:1.6;margin:0 0 16px;">${c.p1}</p>
            <p style="font-size:16px;color:#1D0E03;line-height:1.6;margin:0 0 16px;">${c.p2}</p>
            <p style="font-size:16px;color:#1D0E03;line-height:1.6;margin:0 0 28px;">${c.p3}</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
              <tr>
                <td align="center" style="background:#598D38;padding:14px 32px;">
                  <a href="${opts.siteUrl}" style="color:#ffffff;font-family:Georgia,serif;font-size:16px;font-weight:bold;text-decoration:none;">${escapeHtml(c.cta)}</a>
                </td>
              </tr>
            </table>
            <p style="font-size:15px;color:#1D0E03;line-height:1.6;margin:0;">${c.sign}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px;border-top:1px solid #1D0E03;background:#f9f5f0;">
            <p style="font-size:12px;color:#8D8580;text-align:center;margin:0;">${c.footer}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    from: `${b.fromName} <${opts.fromEmail}>`,
    subject: b.welcomeSubject,
    html,
  };
}

// ---------- NEW POST NOTIFICATION ------------------------------------

const NEWPOST_COPY = {
  it: {
    cta: 'Leggi la ricetta',
    footer: (nome: string) =>
      `Ciao ${escapeHtml(nome)}! Ricevi questa email perché ti sei iscritta alla newsletter di Ricette per Pippe.`,
    unsubscribeText: 'Cancellami dalla newsletter',
  },
  en: {
    cta: 'Read the recipe',
    footer: (nome: string) =>
      `Hi ${escapeHtml(nome)}! You're getting this email because you subscribed to Clueless Cooks.`,
    unsubscribeText: 'Unsubscribe',
  },
  fr: {
    cta: 'Lire la recette',
    footer: (nome: string) =>
      `Bonjour ${escapeHtml(nome)} ! Vous recevez cet email car vous êtes inscrit à Recettes pour Quiches.`,
    unsubscribeText: 'Me désinscrire',
  },
} as const;

export interface NewPost {
  title: string;
  description: string;
  heroImage: string; // assoluto o relativo a siteUrl
  url: string;
}

export function newPostEmail(
  lang: Lang,
  opts: {
    nome: string;
    post: NewPost;
    unsubscribeUrl: string;
    fromEmail: string;
    siteUrl: string;
  },
): EmailEnvelope {
  const b = BRAND[lang];
  const c = NEWPOST_COPY[lang];
  const site = opts.siteUrl.replace(/\/$/, '');
  const heroImg = opts.post.heroImage.startsWith('http')
    ? opts.post.heroImage
    : `${site}${opts.post.heroImage.startsWith('/') ? '' : '/'}${opts.post.heroImage}`;

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<body style="margin:0;padding:0;background:#f9f5f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #1D0E03;border-radius:8px;overflow:hidden;max-width:100%;">
        <tr><td><img src="${heroImg}" alt="" width="600" style="display:block;width:100%;height:auto;"></td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;color:#1D0E03;font-size:28px;line-height:1.2;">${escapeHtml(opts.post.title)}</h1>
          <p style="margin:0 0 24px;font-size:17px;color:#1D0E03;line-height:1.6;">${escapeHtml(opts.post.description)}</p>
          <p style="margin:0;"><a href="${opts.post.url}" style="display:inline-block;padding:12px 24px;background:#1D0E03;color:#fff;text-decoration:none;border-radius:4px;font-weight:bold;">${escapeHtml(c.cta)}</a></p>
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #ccc;font-size:12px;color:#666;line-height:1.5;">
          ${c.footer(opts.nome)}<br>
          <a href="${opts.unsubscribeUrl}" style="color:#666;">${escapeHtml(c.unsubscribeText)}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    from: `${b.fromName} <${opts.fromEmail}>`,
    subject: `${b.newPostPrefix}${opts.post.title}`,
    html,
  };
}

// ---------- UTIL ------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
