// scripts/auth.js
import { supabase } from "./supabase.js";

export async function iniciarSesion(email, contraseña) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: contraseña,
  });
  return { data, error };
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
