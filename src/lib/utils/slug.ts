/**
 * Convierte un nombre en un slug URL-friendly
 * - Reemplaza espacios con guiones
 * - Elimina caracteres especiales
 * - Convierte a minúsculas
 * - Elimina espacios extras
 */
export function createSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    // Reemplazar espacios y caracteres especiales con guiones
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres que no son alfanuméricos, espacios o guiones
    .replace(/[\s_]+/g, '-') // Reemplazar espacios y guiones bajos con guiones
    .replace(/^-+|-+$/g, '') // Eliminar guines al inicio y final
    .replace(/-+/g, '-'); // Eliminar guiones duplicados
}

/**
 * Convierte un slug de vuelta al nombre original
 * Nota: Esto es una aproximación, ya que el slug pierde información
 */
export function slugToName(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
