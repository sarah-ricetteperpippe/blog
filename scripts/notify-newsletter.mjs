// scripts/notify-newsletter.mjs
//
// Triggered by .github/workflows/notify-newsletter.yml on push to main.
// Rileva i .md/.mdx aggiunti sotto src/content/{blog,academy}/<lang>/ nel
// commit più recente, parsa il frontmatter, aspetta che il primo post sia
// live sul sito (per gestire il delay del deploy Netlify), poi POSTa il
// payload al webhook n8n "Send recipe flow".
//
// Env vars (impostate dal workflow):
//   SITE_URL                  URL pubblica del sito (es: https://ricetteperpippe.com)
//   N8N_SEND_RECIPE_WEBHOOK   Production URL del webhook n8n "Send recipe flow"

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const SITE_URL = (process.env.SITE_URL || 'https://ricetteperpippe.com').replace(
  /\/$/,
  '',
);
const N8N_SEND_RECIPE_WEBHOOK = process.env.N8N_SEND_RECIPE_WEBHOOK;

if (!N8N_SEND_RECIPE_WEBHOOK) {
  console.error(
    'N8N_SEND_RECIPE_WEBHOOK env var is not set. Add it as a repo secret on GitHub.',
  );
  process.exit(1);
}

// Map content collection name -> URL path segment (academy lives at /guide/).
const COLLECTION_TO_URL_SEGMENT = {
  blog: 'blog',
  academy: 'guide',
};

const POLL_MAX_ATTEMPTS = 60; // 60 × 10s = 10 minuti max
const POLL_INTERVAL_MS = 10_000;

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    let [, key, value] = m;
    value = value.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return data;
}

function getAddedContentFiles() {
  // --diff-filter=A: only files Added in the diff
  // HEAD~1..HEAD: changes introduced by the most recent commit
  const cmd =
    "git diff --diff-filter=A --name-only HEAD~1 HEAD -- 'src/content/blog/' 'src/content/academy/'";
  const out = execSync(cmd, { encoding: 'utf8' });
  return out
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => /\.(md|mdx)$/.test(p));
}

async function waitForPostLive(url) {
  for (let i = 1; i <= POLL_MAX_ATTEMPTS; i++) {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (res.ok) {
        console.log(`  ✅ Post live: ${url}`);
        return true;
      }
      console.log(
        `  ⏳ Attempt ${i}/${POLL_MAX_ATTEMPTS}: status ${res.status}, retrying in ${POLL_INTERVAL_MS / 1000}s...`,
      );
    } catch (err) {
      console.log(
        `  ⏳ Attempt ${i}/${POLL_MAX_ATTEMPTS}: fetch error (${err.message}), retrying in ${POLL_INTERVAL_MS / 1000}s...`,
      );
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return false;
}

// ---------- MAIN -----------------------------------------------------

const added = getAddedContentFiles();

if (added.length === 0) {
  console.log('No newly added content files in this push. Nothing to notify.');
  process.exit(0);
}

console.log(`Detected ${added.length} new content file(s):`);
added.forEach((p) => console.log(`  - ${p}`));

const posts = [];
for (const file of added) {
  // Expected shape: src/content/<collection>/<lang>/<slug>.{md,mdx}
  const parts = file.split('/');
  if (parts.length !== 5 || parts[0] !== 'src' || parts[1] !== 'content') {
    console.warn(`  ! Skipping unexpected path: ${file}`);
    continue;
  }
  const [, , collection, lang, basename] = parts;
  const urlSegment = COLLECTION_TO_URL_SEGMENT[collection];
  if (!urlSegment) {
    console.warn(`  ! Unknown collection "${collection}" for ${file}`);
    continue;
  }
  if (!['it', 'en', 'fr'].includes(lang)) {
    console.warn(`  ! Unknown lang "${lang}" for ${file}, skipping`);
    continue;
  }
  const slug = basename.replace(/\.(md|mdx)$/, '');
  const raw = readFileSync(file, 'utf8');
  const fm = parseFrontmatter(raw);
  if (!fm) {
    console.warn(`  ! No parseable frontmatter in ${file}, skipping`);
    continue;
  }

  // Skip drafts esplicitamente segnati come tali
  if (fm.draft === 'true' || fm.draft === true) {
    console.log(`  ⊘ Skipping draft: ${file}`);
    continue;
  }

  posts.push({
    collection,
    lang,
    slug,
    title: fm.title || '',
    description: fm.description || '',
    heroImage: fm.heroImage || '',
    pubDate: fm.pubDate || '',
    url: `${SITE_URL}/${lang}/${urlSegment}/${slug}/`,
  });
}

if (posts.length === 0) {
  console.log('No posts to notify after filtering. Exiting.');
  process.exit(0);
}

console.log(`\nPosts to notify (${posts.length}):`);
console.log(JSON.stringify(posts, null, 2));

// Aspetta che il primo post sia effettivamente live sul sito.
// Netlify ci mette ~3-5 min per deployare dopo il push. Polling fino a 10 min.
console.log(`\nWaiting for first post URL to become live (max 10 min)...`);
const firstPostUrl = posts[0].url;
const isLive = await waitForPostLive(firstPostUrl);
if (!isLive) {
  console.error(
    `\nFirst post never became live within timeout: ${firstPostUrl}`,
  );
  console.error('Aborting notify — Netlify deploy probably failed or is slow.');
  process.exit(1);
}

// Send-recipe via n8n webhook.
console.log(`\nPosting ${posts.length} post(s) to n8n send-recipe webhook...`);

const res = await fetch(N8N_SEND_RECIPE_WEBHOOK, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ posts }),
});

const responseText = await res.text().catch(() => '');

if (!res.ok) {
  console.error(`Endpoint responded with ${res.status}: ${responseText}`);
  process.exit(1);
}

console.log(`Endpoint OK (${res.status}): ${responseText}`);
