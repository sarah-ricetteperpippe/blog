// Cloudflare Worker: redirect lingua sulla root "/" e redirect delle vecchie URL,
// il resto sono asset statici.
// Sostituisce la vecchia edge function Netlify (lang-redirect.js).
// I parametri di query (utm_*, fbclid di Instagram/Facebook) vengono conservati.

// Vecchie URL -> nuove, con 301 vero (lo scraper di Meta non segue i <meta refresh>)
const LEGACY = {
  '/ricette': '/it/blog/',
  '/ricette/': '/it/blog/',
};

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    const legacy = LEGACY[url.pathname];
    if (legacy) return Response.redirect(`${url.origin}${legacy}${url.search}`, 301);

    if (url.pathname !== '/') return env.ASSETS.fetch(request);

    const supported = ['it', 'en', 'fr'];
    const header = request.headers.get('accept-language') || 'it';

    // Estrai la prima lingua preferita (es. "en-US,en;q=0.9,it;q=0.8" -> "en")
    const lang = header
      .split(',')[0]
      .split('-')[0]
      .toLowerCase()
      .trim();

    const target = supported.includes(lang) ? lang : 'it';

    // 302 (non 301): la destinazione dipende dalla lingua del visitatore
    return Response.redirect(`${url.origin}/${target}/${url.search}`, 302);
  },
};
