// Serves the public Supabase settings to the browser.
// Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel > Project > Settings > Environment Variables.
// (The Supabase integration's NEXT_PUBLIC_* names work too.) The anon key is meant to be public.
module.exports = (req, res) => {
  const env = process.env;
  const cfg = {
    supabaseUrl: env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
  };
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end('window.CV_CONFIG = ' + JSON.stringify(cfg) + ';');
};
