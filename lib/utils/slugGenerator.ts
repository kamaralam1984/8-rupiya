/**
 * Slug Generator Utility
 * 
 * Generates unique URL slugs for shops based on shop name and ID
 */

/**
 * Convert text to URL-friendly slug
 * @param text - Text to convert to slug
 * @returns URL-friendly slug
 */
export function textToSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace Hindi/Devanagari characters with transliteration (basic)
    .replace(/[अ]/g, 'a')
    .replace(/[आ]/g, 'aa')
    .replace(/[इ]/g, 'i')
    .replace(/[ई]/g, 'ii')
    .replace(/[उ]/g, 'u')
    .replace(/[ऊ]/g, 'uu')
    .replace(/[ए]/g, 'e')
    .replace(/[ऐ]/g, 'ai')
    .replace(/[ओ]/g, 'o')
    .replace(/[औ]/g, 'au')
    .replace(/[क]/g, 'ka')
    .replace(/[ख]/g, 'kha')
    .replace(/[ग]/g, 'ga')
    .replace(/[घ]/g, 'gha')
    .replace(/[च]/g, 'cha')
    .replace(/[छ]/g, 'chha')
    .replace(/[ज]/g, 'ja')
    .replace(/[झ]/g, 'jha')
    .replace(/[ट]/g, 'ta')
    .replace(/[ठ]/g, 'tha')
    .replace(/[ड]/g, 'da')
    .replace(/[ढ]/g, 'dha')
    .replace(/[ण]/g, 'na')
    .replace(/[त]/g, 'ta')
    .replace(/[थ]/g, 'tha')
    .replace(/[द]/g, 'da')
    .replace(/[ध]/g, 'dha')
    .replace(/[न]/g, 'na')
    .replace(/[प]/g, 'pa')
    .replace(/[फ]/g, 'pha')
    .replace(/[ब]/g, 'ba')
    .replace(/[भ]/g, 'bha')
    .replace(/[म]/g, 'ma')
    .replace(/[य]/g, 'ya')
    .replace(/[र]/g, 'ra')
    .replace(/[ल]/g, 'la')
    .replace(/[व]/g, 'va')
    .replace(/[श]/g, 'sha')
    .replace(/[ष]/g, 'sha')
    .replace(/[स]/g, 'sa')
    .replace(/[ह]/g, 'ha')
    // Remove special characters and replace spaces/symbols with hyphens
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique shop URL slug
 * @param shopName - Name of the shop
 * @param shopId - Unique shop ID (MongoDB ObjectId string)
 * @returns Unique shop URL (e.g., "/shop/abc-store-507f1f77")
 */
export function generateShopUrl(shopName: string, shopId: string): string {
  const nameSlug = textToSlug(shopName);
  // Take last 8 characters of the shop ID for uniqueness
  const idSuffix = shopId.slice(-8);
  
  // Combine name slug with ID suffix for uniqueness
  // Max length: 50 characters for name + 8 for ID + hyphens
  const maxNameLength = 50;
  const truncatedName = nameSlug.slice(0, maxNameLength);
  
  return `/shop/${truncatedName}-${idSuffix}`;
}

/**
 * Generate a unique shop slug (without /shop/ prefix)
 * Useful for database storage
 * @param shopName - Name of the shop
 * @param shopId - Unique shop ID (MongoDB ObjectId string)
 * @returns Unique shop slug (e.g., "abc-store-507f1f77")
 */
export function generateShopSlug(shopName: string, shopId: string): string {
  const nameSlug = textToSlug(shopName);
  const idSuffix = shopId.slice(-8);
  const maxNameLength = 50;
  const truncatedName = nameSlug.slice(0, maxNameLength);
  
  return `${truncatedName}-${idSuffix}`;
}

/**
 * Validate if a slug is valid
 * @param slug - Slug to validate
 * @returns true if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  // Slug should only contain lowercase letters, numbers, and hyphens
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100;
}

