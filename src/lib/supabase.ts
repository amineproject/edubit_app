import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 
  import.meta.env?.VITE_SUPABASE_URL || 'https://ugvcywndinfqiukbrgig.supabase.co';

export const SUPABASE_ANON_KEY = 
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rnhioflH1PPtZAT2c5JelQ_Km70aX0O';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
