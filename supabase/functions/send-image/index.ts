import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

// Verify Telegram WebApp initData
async function verifyTelegramWebAppData(initData: string): Promise<{ valid: boolean; userId?: string }> {
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

    // Extract user ID from initData
    const userParam = urlParams.get("user");
    if (userParam) {
      const userData = JSON.parse(userParam);
      return { valid: true, userId: userData.id?.toString() };
    }

    return { valid: false };
  } catch (error) {
    console.error("Error verifying Telegram data:", error);
    return { valid: false };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, initData } = await req.json();

    if (!image || !initData) {
      return new Response(JSON.stringify({ error: "image and initData are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify Telegram WebApp data
    const verification = await verifyTelegramWebAppData(initData);
    if (!verification.valid || !verification.userId) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid Telegram data" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate image format and extract Base64
    const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
    const match = image.match(base64Pattern);
    
    if (!match) {
      return new Response(JSON.stringify({ error: "Invalid image format. Only JPEG, PNG, and WebP are supported" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanBase64 = match[2];
    
    // Validate Base64 size (max 10MB)
    const sizeInBytes = (cleanBase64.length * 3) / 4;
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    
    if (sizeInBytes > maxSizeInBytes) {
      return new Response(JSON.stringify({ error: "Image size exceeds 10MB limit" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // إرسال Base64 فقط إلى الباك-إند
    const response = await fetch("http://151.241.228.83/api/send-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: verification.userId,
        image: cleanBase64, // Base64 فقط بدون أي بادئة
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
