import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get Telegram WebApp initData
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            id: number;
          };
        };
      };
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, userId } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // إزالة البادئة (مثل data:image/jpeg;base64,)
    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");

    // استخدام userId القادم من التلغرام أو القيمة الافتراضية
    const targetUserId = userId || "7957114706";

    console.log("Sending image to user:", targetUserId);

    // إرسال الصورة إلى الباك-إند
    const response = await fetch("https://channelsseller.site/api/send-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: targetUserId,
        image: cleanBase64, // Base64 صافي بدون البادئة
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send image error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
