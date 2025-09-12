// scripts/db.js
import { supabase } from "./supabase.js";

export const db = {
  // Obtener todos los registros de una tabla
  async obtenerTodos(tabla) {
    const { data, error } = await supabase.from(tabla).select("*");
    return { data, error };
  },

  // Insertar un nuevo registro
  async insertar(tabla, datos) {
    const { data, error } = await supabase.from(tabla).insert(datos).select();
    return { data, error };
  },

  // Actualizar un registro
  async actualizar(tabla, id, datos) {
    const { data, error } = await supabase
      .from(tabla)
      .update(datos)
      .eq("id", id)
      .select();
    return { data, error };
  },

  // Eliminar un registro
  async eliminar(tabla, id) {
    const { error } = await supabase.from(tabla).delete().eq("id", id);
    return { error };
  },
};
