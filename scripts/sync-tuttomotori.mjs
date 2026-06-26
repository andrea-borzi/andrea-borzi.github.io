// scripts/sync-tuttomotori.mjs
// Legge il feed RSS pubblico del canale YouTube e aggiorna data/tuttomotori.json.
// Nessuna API key: il feed RSS è pubblico. Richiede Node 18+ (fetch integrato).
//
// Imposta l'ID canale nella variabile di repo YT_CHANNEL_ID
// (GitHub -> Settings -> Secrets and variables -> Actions -> Variables).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// ID del canale Tutto Motori (già impostato). Si può sovrascrivere con la
// variabile di repo YT_CHANNEL_ID, ma non è necessario.
const CHANNEL_ID = process.env.YT_CHANNEL_ID || 'UCi4pZJuT9xxaCiaIhc5Z5aQ';
const OUT = 'data/tuttomotori.json';

if (!CHANNEL_ID) {
  console.error('✗ Manca YT_CHANNEL_ID. Imposta la variabile di repo con l\'ID del canale (es. UCxxxxxxxxxxxxxxxxxxxxxx).');
  process.exit(1);
}

function decode(s = '') {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const res = await fetch(feedUrl, { headers: { 'User-Agent': 'portfolio-sync' } });
if (!res.ok) {
  console.error('✗ Feed non raggiungibile:', res.status, feedUrl);
  process.exit(1);
}
const xml = await res.text();

// estrae le <entry> del feed (le ultime ~15 pubblicazioni)
const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => m[1]);
const fresh = entries.map(e => {
  const id = (e.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1];
  const title = decode((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
  const published = (e.match(/<published>(.*?)<\/published>/) || [])[1] || '';
  return id ? { id, title, published } : null;
}).filter(Boolean);

// carica l'archivio esistente
let existing = [];
if (existsSync(OUT)) {
  try { existing = JSON.parse(await readFile(OUT, 'utf8')); } catch { existing = []; }
}

// merge + dedupe per id (i dati freschi arricchiscono quelli vecchi)
const byId = new Map(existing.map(v => [v.id, v]));
for (const v of fresh) byId.set(v.id, { ...byId.get(v.id), ...v });

// ordina: i più recenti (con data) in cima, l'archivio storico sotto
const merged = [...byId.values()].sort((a, b) => {
  if (a.published && b.published) return b.published.localeCompare(a.published);
  if (a.published) return -1;
  if (b.published) return 1;
  return 0;
});

await mkdir('data', { recursive: true });
await writeFile(OUT, JSON.stringify(merged, null, 2) + '\n');
console.log(`✓ Scritti ${merged.length} video in ${OUT} (${fresh.length} dal feed).`);
