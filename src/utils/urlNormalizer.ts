/**
 * Normalize image URLs from API responses
 * Converts localhost URLs to production domain
 */
export const normalizeImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  
  // If already a valid HTTPS URL from correct domain, return as is
  if (url.startsWith('https://www.channelsseller.site')) {
    return url;
  }
  
  // If it's a data URL (base64), return as is
  if (url.startsWith('data:')) {
    return url;
  }
  
  // If it's a relative path, prepend the domain
  if (url.startsWith('/')) {
    return `https://www.channelsseller.site${url}`;
  }
  
  // If it contains localhost (development URLs), replace with production domain
  if (url.includes('localhost')) {
    // Extract the path part after localhost:port
    const match = url.match(/localhost:\d+(.+)/);
    if (match && match[1]) {
      return `https://www.channelsseller.site${match[1]}`;
    }
  }
  
  // If it's an HTTP URL (insecure), convert to HTTPS with correct domain
  if (url.startsWith('http://')) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;
      return `https://www.channelsseller.site${path}`;
    } catch (e) {
      console.warn('Failed to parse URL:', url);
      return url;
    }
  }
  
  // If none of the above, assume it's a path and prepend domain
  if (!url.startsWith('http')) {
    return `https://www.channelsseller.site/api/image/${url}`;
  }
  
  return url;
};

/**
 * Normalize an entire object's image URLs
 */
export const normalizeObjectImageUrls = <T extends Record<string, any>>(
  obj: T,
  imageFields: (keyof T)[] = ['image_url', 'image', 'imageUrl']
): T => {
  const normalized = { ...obj };
  
  imageFields.forEach(field => {
    if (field in normalized && typeof normalized[field] === 'string') {
      normalized[field] = normalizeImageUrl(normalized[field] as string) as any;
    }
  });
  
  return normalized;
};

/**
 * Normalize array of objects' image URLs
 */
export const normalizeArrayImageUrls = <T extends Record<string, any>>(
  array: T[],
  imageFields: (keyof T)[] = ['image_url', 'image', 'imageUrl']
): T[] => {
  return array.map(item => normalizeObjectImageUrls(item, imageFields));
};
