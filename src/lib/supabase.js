import { createClient } from '@supabase/supabase-js';

const rawUrl  = import.meta.env.VITE_SUPABASE_URL  ?? '';
const rawAnon = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Treat placeholder values or empty strings as unconfigured
const isValidUrl  = rawUrl.startsWith('https://') && rawUrl.includes('.supabase.co');
const isValidAnon = rawAnon.length > 20 && !rawAnon.startsWith('your_');

const configured = isValidUrl && isValidAnon;

if (!configured) {
  console.warn(
    '[Blackboard] Supabase is not configured. Auth is disabled.\n' +
    'To enable auth, create a .env file in the project root:\n' +
    '  VITE_SUPABASE_URL=https://xxxx.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your_anon_key\n' +
    'See src/lib/supabase.js for full setup instructions.'
  );
}

export const supabase = configured
  ? createClient(rawUrl, rawAnon)
  : null;
