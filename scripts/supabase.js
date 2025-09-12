// scripts/supabase.js
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Configuración de Supabase
const supabaseUrl = "https://zalcwwxxhadyznllxwkz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphbGN3d3h4aGFkeXpubGx4d2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NDUwMjIsImV4cCI6MjA3MzIyMTAyMn0.o5CClf5FkZLqpyKO1e4T3-h26gG-ZKcoTt4-Qp6MbzM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
