const SUPABASE_URL = 'https://hepkljurqjkypjhdmuhq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KDhVcv9d26L2-jZr4Lqa8A_akX-aKjW';

// Inicializar cliente de Supabase
// Usamos 'sb' para evitar conflictos con la variable global 'supabase' de la librería
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
