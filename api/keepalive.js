// Daily keep-alive: Vercel Cron calls this once a day (see "crons" in vercel.json).
// It runs two tiny read queries so the free Supabase project never looks inactive
// and doesn't get paused when nobody has played for a week.
module.exports = async (req, res) => {
  const env = process.env;
  const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  if (!url || !key) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: 'Supabase settings are missing' }));
  }
  const headers = { apikey: key, Authorization: 'Bearer ' + key };
  const out = {};
  try {
    for (const table of ['cv_results', 'cv_players']) {
      const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers });
      out[table] = r.status;
    }
    const ok = Object.values(out).every(s => s === 200);
    res.statusCode = ok ? 200 : 502;
    res.end(JSON.stringify({ ok, status: out, at: new Date().toISOString() }));
  } catch (e) {
    res.statusCode = 502;
    res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
  }
};
