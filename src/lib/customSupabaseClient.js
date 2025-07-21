import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qeuqspjpwybaxppqgehm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFldXFzcGpwd3liYXhwcHFnZWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTE1NjMsImV4cCI6MjA2ODU4NzU2M30.y3id7Za86ogClNv_tzeEyF9H1Q049Le3OPCuOQGvgMk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);