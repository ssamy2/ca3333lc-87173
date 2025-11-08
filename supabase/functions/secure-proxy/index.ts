import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-token',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    const authToken = req.headers.get('x-auth-token');
    
    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'MISSING_ENDPOINT', message: 'endpoint parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!authToken) {
      return new Response(JSON.stringify({ error: 'MISSING_TOKEN', message: 'Authentication token is required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Verifying token...');

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify token and get remaining operations
    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens')
      .select('*')
      .eq('token', authToken)
      .gt('operations_remaining', 0)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      console.error('Invalid or expired token:', tokenError);
      return new Response(JSON.stringify({ 
        error: 'TOKEN_EXPIRED', 
        message: 'Your session has expired. Please re-authenticate to continue.' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Token valid. Operations remaining: ${tokenData.operations_remaining}`);

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

    // Decrement operations counter
    const newCount = tokenData.operations_remaining - 1;
    
    if (newCount <= 0) {
      // Delete token if no operations remaining
      await supabase
        .from('tokens')
        .delete()
        .eq('id', tokenData.id);
      
      console.log('Token deleted - no operations remaining');
    } else {
      // Update operations counter
      await supabase
        .from('tokens')
        .update({ operations_remaining: newCount })
        .eq('id', tokenData.id);
      
      console.log(`Operations decremented to: ${newCount}`);
    }
    
    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'X-Operations-Remaining': newCount.toString(),
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'SERVER_ERROR', message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
