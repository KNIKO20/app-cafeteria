/**
 * imageHelper.ts
 * Resuelve imágenes de alimentos y provee fallbacks si no hay foto.
 */

// ── Fallbacks por categoría ───────────────────────────────────────────────────
const CATEGORY_TERMS: Record<string, string> = {
  bocadillo: 'sandwich,burger',
  bebida:    'drink,beverage',
  postre:    'dessert,cake',
  saludable: 'salad,fruit',
};

const DEFAULT_TERM = 'food,meal';

/**
 * Devuelve un fallback usando loremflickr según la categoría y nombre para
 * darle consistencia al azar.
 */
export function getProductImage(name: string, category?: string): string {
  const term = CATEGORY_TERMS[category?.toLowerCase() ?? ''] ?? DEFAULT_TERM;
  // Usamos el nombre para generar una "seed" de número semi-aleatorio estable
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `https://loremflickr.com/400/400/${term}/all?lock=${hash}`;
}

/**
 * Devuelve la mejor URL disponible:
 * Prioriza la URL de la base de datos si existe, sino usa un fallback.
 */
export function resolveImage(
  name: string,
  category?: string,
  imageUrl?: string,
): string {
  if (imageUrl && imageUrl.trim().length > 0) {
    return imageUrl;
  }
  return getProductImage(name, category);
}
