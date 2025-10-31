-- Create tokens table for Telegram authentication
CREATE TABLE public.tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id BIGINT NOT NULL,
  username TEXT,
  token TEXT NOT NULL UNIQUE,
  operations_remaining INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Enable Row Level Security
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for service role only (accessed via edge functions)
CREATE POLICY "Service role can manage tokens"
ON public.tokens
FOR ALL
USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX idx_tokens_token ON public.tokens(token);
CREATE INDEX idx_tokens_user_id ON public.tokens(user_id);
CREATE INDEX idx_tokens_expires_at ON public.tokens(expires_at);

-- Create function to cleanup expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.tokens
  WHERE expires_at < now() OR operations_remaining <= 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update last_used_at
CREATE OR REPLACE FUNCTION public.update_token_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tokens_last_used
BEFORE UPDATE ON public.tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_token_last_used();