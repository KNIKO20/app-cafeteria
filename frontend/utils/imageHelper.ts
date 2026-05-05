/**
 * imageHelper.ts
 * Resuelve imágenes de alimentos.
 */

/**
 * Devuelve un fallback vacío para carga manual.
 */
export function getProductImage(name: string, category?: string): string {
  // Ya no devolvemos imágenes automáticas de loremflickr.
  return '';
}

/**
 * Devuelve la URL de la imagen si existe.
 */
export function resolveImage(
  name: string,
  category?: string,
  imageUrl?: string,
): string {
  if (imageUrl && imageUrl.trim().length > 0) {
    return imageUrl;
  }
  return '';
}
