/**
 * Cloudinary image optimization utilities.
 * Adds f_auto,q_auto,w_* transformations to reduce bandwidth 60-80%.
 */

/**
 * Optimizes a Cloudinary URL by adding auto-format and quality transformations.
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Optimization options
 * @param {number} options.width - Max width in pixels (default: 800)
 * @param {number} options.quality - Quality 1-100 (default: 'auto')
 * @param {string} options.format - 'auto' for webp/avif, or 'jpg','png','webp'
 * @returns {string} Optimized URL
 */
export function optimizeCloudinary(url, { width = 800, quality = "auto", format = "auto" } = {}) {
  if (!url || typeof url !== "string") return url;

  // Only transform Cloudinary URLs
  if (!url.includes("res.cloudinary.com")) return url;

  // Don't double-transform
  if (url.includes("/upload/f_") || url.includes("/upload/q_")) return url;

  // Build transformation string: f_auto,q_auto,w_800
  const transforms = [`f_${format}`, `q_${quality}`];
  if (width) transforms.push(`w_${width}`);

  const transformStr = transforms.join(",");

  // Insert after /upload/ (before version or public_id)
  // Pattern: .../upload/[/v123456/]public_id.jpg
  return url.replace(/\/upload\//, `/upload/${transformStr}/`);
}

/**
 * Optimizes an array of Cloudinary URLs.
 */
export function optimizeCloudinaryBatch(urls, options) {
  if (!Array.isArray(urls)) return urls;
  return urls.map((url) => optimizeCloudinary(url, options));
}
