// scripts/notify-newsletter.mjs
//
// Triggered by .github/workflows/notify-newsletter.yml on push to main.
// Detects new .md files added under src/content/{blog,academy}/<lang>/ in the
// most recent commit, parses their frontmatter, and POSTs the resulting array
// of posts to the n8n webhook configured in N8N_PUBLISH_WEBHOOK.
//
// n8n Workflow 2 receives this payload and dispatches branded emails to the
// matching subscribers (filtered by lang).

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const WEBHOOK_URL = process.env.N8N_PUBLISH_WEBHOOK;
const SITE_URL = (process.env.SITE_URL || 'https://ricetteperpippe.com').replace(/\/$/, '');

if (!WEBHOOK_URL) {
  console.error('N8N_PUBLISH_WEBHOOK env var is not set.');
  process.exit(1);
}

// Map content collection name -> URL path segment (academy lives at /guide/).
const COLLECTION_TO_URL_SEGMENT = {
  blog: 'blog',
  academy: 'guide',
};

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
    .filter((p) => p.endsWith('.md'));
}

const added = getAddedContentFiles();

if (added.length === 0) {
  console.log('No newly added content files in this push. Nothing to notify.');
  process.exit(0);
}

console.log(`Detected ${added.length} new content file(s):`);
added.forEach((p) => console.log(`  - ${p}`));

const posts = [];
for (const file of added) {
  // Expected shape: src/content/<collection>/<lang>/<slug>.md
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
  const slug = basename.replace(/\.md$/, '');
  const raw = readFileSync(file, 'utf8');
  const fm = parseFrontmatter(raw);
  if (!fm) {
    console.warn(`  ! No parseable frontmatter in ${file}, skipping`);
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
    url: `${SITE_URL}/${lang}/${urlSegment}/${slug}`,
  });
}

if (posts.length === 0) {
  console.log('No posts to notify after filtering. Exiting.');
  process.exit(0);
}

console.log(`\nPosting ${posts.length} post(s) to n8n webhook...`);
console.log(JSON.stringify(posts, null, 2));

const res = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ posts }),
});

if (!res.ok) {
  const body = await res.text().catch(() => '');
  console.error(`Webhook responded with ${res.status}: ${body}`);
  process.exit(1);
}

console.log(`Webhook OK (${res.status}).`);
