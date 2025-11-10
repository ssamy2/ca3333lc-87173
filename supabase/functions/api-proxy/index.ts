import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    
    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'endpoint parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build the target API URL
    const apiBaseUrl = 'http://151.241.228.83:8001';
    const targetUrl = `${apiBaseUrl}${endpoint}`;
    
    console.log('Proxying request to:', targetUrl);

    // Forward the request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json, image/*',
        'User-Agent': 'Lovable-Proxy/1.0',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    });

    console.log('Proxy response status:', response.status);

    // Check if this is an image response
    const contentType = response.headers.get('Content-Type') || '';
    const isImage = contentType.startsWith('image/');
    
    if (isImage) {
      // For images, return binary data with proper headers
      const imageData = await response.arrayBuffer();
      return new Response(imageData, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      });
    }

    // For JSON/text responses
    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType || 'application/json',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});