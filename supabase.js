const { createClient } = window.supabase;

const SUPABASE_URL = "https://qtklnouudinldfohwhnt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0a2xub3V1ZGlubGRmb2h3aG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTcyNzgsImV4cCI6MjA4ODU5MzI3OH0.yZTSHcbJ__NCYDzWeHSBmnrqb-6qmVd47q92Eq9gEzg";

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);