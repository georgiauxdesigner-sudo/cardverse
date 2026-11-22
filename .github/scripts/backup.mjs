// Weekly DeckFlix backup: copies every player record and every game result from Supabase
// into backups/ in this repo. It reads the public Supabase settings straight from the live
// site (/api/config), so no secrets need to be set up. Uses Node 20+ (built-in fetch).
import { mkdir, writeFile } from 'node:fs/promises';

const SITE = process.env.SITE_URL || 'https://deckflix.vercel.app';
const TABLES = { players: ['cv_players', 'player_id'], results: ['cv_results', 'id'] };
const PAGE = 1000;

const cfgJs = await (await fetch(`${SITE}/api/config`, { cache: 'no-store' })).text();
const cfg = JSON.parse(cfgJs.replace(/^[^{]*/, '').replace(/;\s*$/, ''));
if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error('Supabase settings missing from /api/config');
const headers = { apikey: cfg.supabaseAnonKey, Authorization: `Bearer ${cfg.supabaseAnonKey}` };

async function dump(table, orderBy) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const url = `${cfg.supabaseUrl}/rest/v1/${table}?select=*&order=${orderBy}.asc&limit=${PAGE}&offset=${from}`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`${table}: HTTP ${r.status} ${await r.text()}`);
    const page = await r.json();
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

const out = { app: 'DeckFlix', taken_at: new Date().toISOString(), source: cfg.supabaseUrl };
for (const [key, [table, orderBy]] of Object.entries(TABLES)) out[key] = await dump(table, orderBy);
out.counts = { players: out.players.length, results: out.results.length };

const day = out.taken_at.slice(0, 10);
await mkdir('backups', { recursive: true });
const json = JSON.stringify(out, null, 1) + '\n';
await writeFile(`backups/${day}.json`, json);
await writeFile('backups/latest.json', json);
console.log(`Backed up ${out.counts.players} players and ${out.counts.results} results to backups/${day}.json`);
