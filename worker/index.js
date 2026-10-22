// Cloudflare Worker: redirect lingua sulla root "/", il resto sono asset statici.
// Stessa logica di functions/index.js (Pages) e netlify/edge-functions/lang-redirect.js.
export default {
  fetch(request, env) {
    const url = new URL(request.url);

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

    return Response.redirect(`${url.origin}/${target}/`, 302);
  },
};
