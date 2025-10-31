-- Fix search_path for security functions by dropping cascade and recreating
DROP TRIGGER IF EXISTS update_tokens_last_used ON public.tokens;
DROP FUNCTION IF EXISTS public.update_token_last_used() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_tokens() CASCADE;

-- Recreate cleanup function with proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.tokens
  WHERE expires_at < now() OR operations_remaining <= 0;
END;
$$;

-- Recreate trigger function with proper search_path
CREATE OR REPLACE FUNCTION public.update_token_last_used()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.last_used_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_tokens_last_used
BEFORE UPDATE ON public.tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_token_last_used();