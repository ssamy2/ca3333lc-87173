import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

// Verify Telegram WebApp initData
async function verifyTelegramWebAppData(initData: string): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return false;
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    urlParams.delete("hash");

    if (!hash) {
      return false;
    }

    // Sort parameters alphabetically
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    // Create secret key
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode("WebAppData"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const tokenKey = await crypto.subtle.sign(
      "HMAC",
      secretKey,
      encoder.encode(BOT_TOKEN)
    );

    // Create data hash
    const dataKey = await crypto.subtle.importKey(
      "raw",
      tokenKey,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      dataKey,
      encoder.encode(dataCheckString)
    );

    const calculatedHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return calculatedHash === hash;
  } catch (error) {
    console.error("Error verifying Telegram data:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    const initData = url.searchParams.get('initData');
    
    if (!endpoint || !initData) {
      return new Response(JSON.stringify({ error: 'endpoint and initData parameters are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify Telegram WebApp data
    const isValid = await verifyTelegramWebAppData(initData);
    if (!isValid) {
      console.error("Invalid Telegram WebApp data");
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Telegram data' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build the target API URL
    const apiBaseUrl = 'http://151.241.228.83';
    const targetUrl = `${apiBaseUrl}${endpoint}`;
    
    console.log('Proxying request to:', targetUrl);

    // Forward the request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    });

    // Get response data
    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
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