import { createClient } from '@supabase/supabase-js';

// Read from Vite env (set in .env locally and in Vercel project settings).
// The anon key is safe to expose; the inline fallbacks keep existing deploys working.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://qeuqspjpwybaxppqgehm.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFldXFzcGpwd3liYXhwcHFnZWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTE1NjMsImV4cCI6MjA2ODU4NzU2M30.y3id7Za86ogClNv_tzeEyF9H1Q049Le3OPCuOQGvgMk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
