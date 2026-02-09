const SUPABASE_URL = 'https://hepkljurqjkypjhdmuhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcGtsanVycWpreXBqaGRtdWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTY0NzEsImV4cCI6MjA4NjE3MjQ3MX0.fgkJVlIFpvqLlw8mSDMTyVVtvlL6IOIyqrLY3W2yM0Q';

// Inicializar cliente de Supabase
// Usamos 'sb' para evitar conflictos con la variable global 'supabase' de la librería
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
