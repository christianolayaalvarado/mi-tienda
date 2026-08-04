/**
 * Cloudinary image optimization utilities.
 * Agrega f_auto,q_auto,w_* para reducir consumo de créditos.
 *
 * Créditos: 1 por imagen subida + 1 por transformación.
 * Con f_auto,q_auto,w_400 se reduce ~70% el bandwidth.
 */

/**
 * Optimiza una URL de Cloudinary agregando transformaciones de reducción.
 * @param {string} url - URL original de Cloudinary
 * @param {object} options - Opciones de optimización
 * @param {number} options.width - Ancho máximo en px (default: 400 para cards, 800 para detalle)
 * @param {number} options.quality - Calidad 1-100 (default: 'auto')
 * @param {string} options.format - 'auto' para webp/avif, o 'jpg','png','webp'
 * @returns {string} URL optimizada
 */
export function optimizeCloudinary(url, { width = 400, quality = "auto", format = "auto" } = {}) {
  if (!url || typeof url !== "string") return url;

  // Solo transformar URLs de Cloudinary
  if (!url.includes("res.cloudinary.com")) return url;

  // No transformar si ya tiene transformaciones
  if (url.includes("/upload/f_") || url.includes("/upload/q_") || url.includes("/upload/w_")) return url;

  // Construir transformaciones: f_auto,q_auto,w_400
  const transforms = [`f_${format}`, `q_${quality}`];
  if (width) transforms.push(`w_${width}`);

  const transformStr = transforms.join(",");

  // Insertar después de /upload/ (antes de versión o public_id)
  return url.replace(/\/upload\//, `/upload/${transformStr}/`);
}

/**
 * Optimiza un array de URLs de Cloudinary.
 */
export function optimizeCloudinaryBatch(urls, options) {
  if (!Array.isArray(urls)) return urls;
  return urls.map((url) => optimizeCloudinary(url, options));
}
