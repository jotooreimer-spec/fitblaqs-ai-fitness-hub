-- Create rate_limits table for application-level rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limit entries (for transparency)
CREATE POLICY "Users can view own rate limits" 
ON public.rate_limits FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Create the rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_requests integer,
  p_window_seconds integer
) RETURNS boolean AS $$
DECLARE
  v_count integer;
  v_window_start timestamptz;
BEGIN
  SELECT request_count, window_start INTO v_count, v_window_start
  FROM public.rate_limits
  WHERE user_id = p_user_id AND endpoint = p_endpoint;
  
  IF NOT FOUND OR (now() - v_window_start) > (p_window_seconds || ' seconds')::interval THEN
    INSERT INTO public.rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, now())
    ON CONFLICT (user_id, endpoint) DO UPDATE
    SET request_count = 1, window_start = now();
    RETURN true;
  ELSIF v_count < p_max_requests THEN
    UPDATE public.rate_limits
    SET request_count = request_count + 1
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;