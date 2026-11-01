import { createClient } from '@supabase/supabase-js';

// Substitua pelas suas credenciais que ficam no painel do Supabase (Project Settings > API)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'SUA_URL_DO_SUPABASE';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'SUA_CHAVE_ANONIMA_DO_SUPABASE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);