// Utility to proxy image URLs through our edge function to avoid mixed content issues
export const proxyImageUrl = (imageUrl: string): string => {
  // If the URL is already HTTPS or relative, return as is
  if (!imageUrl || imageUrl.startsWith('https://') || imageUrl.startsWith('/') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // For HTTP URLs from our API, proxy them through our edge function
  if (imageUrl.startsWith('http://')) {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    // Extract the path from the full URL
    const url = new URL(imageUrl);
    const path = url.pathname + url.search;
    
    // Return proxied URL
    return `${SUPABASE_URL}/functions/v1/api-proxy?endpoint=${encodeURIComponent(path)}`;
  }
  
  return imageUrl;
};
