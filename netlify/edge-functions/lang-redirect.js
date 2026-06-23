export default async function (request, context) {
  const url = new URL(request.url);

  // Solo per la root esatta
  if (url.pathname !== '/') return;

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
}

export const config = { path: '/' };
