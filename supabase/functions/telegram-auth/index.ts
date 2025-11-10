import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Verify Telegram WebApp initData
async function verifyTelegramWebAppData(initData: string): Promise<{ valid: boolean; userId?: string; username?: string }> {
  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return { valid: false };
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    urlParams.delete("hash");

    if (!hash) {
      return { valid: false };
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

    if (calculatedHash !== hash) {
      return { valid: false };
    }

    // Extract user info
    const userParam = urlParams.get("user");
    if (userParam) {
      const userData = JSON.parse(userParam);
      return {
        valid: true,
        userId: userData.id?.toString(),
        username: userData.username
      };
    }

    return { valid: false };
  } catch (error) {
    console.error("Error verifying Telegram data:", error);
    return { valid: false };
  }
}

// Generate secure token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();
    
    if (!initData) {
      return new Response(JSON.stringify({ error: 'initData is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Verify Telegram WebApp data
    const verification = await verifyTelegramWebAppData(initData);
    
    if (!verification.valid || !verification.userId) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED', message: 'Invalid Telegram data' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Delete old tokens for this user
    const { error: deleteError } = await supabase
      .from('tokens')
      .delete()
      .eq('user_id', verification.userId);

    if (deleteError) {
      // Silent fail - old tokens might not exist
    }

    // Generate new token
    const newToken = generateToken();

    // Insert new token
    const { data: tokenData, error: insertError } = await supabase
      .from('tokens')
      .insert({
        user_id: parseInt(verification.userId),
        username: verification.username,
        token: newToken,
        operations_remaining: 100
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: 'TOKEN_CREATION_FAILED', message: 'Failed to create token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      token: newToken,
      operations_remaining: 100,
      user_id: verification.userId,
      username: verification.username
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'SERVER_ERROR', message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
