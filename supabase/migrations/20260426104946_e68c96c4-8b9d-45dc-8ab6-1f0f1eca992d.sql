
-- 1. Remove client-side UPDATE policy on subscriptions (must be server-side only)
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;

-- 2. Fix avatars storage: drop any public-role INSERT policies, keep authenticated only
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND 'public' = ANY(roles)
      AND cmd = 'INSERT'
      AND qual IS NULL  -- INSERT uses with_check
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND 'public' = ANY(roles)
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Ensure authenticated-only avatar policies exist
DROP POLICY IF EXISTS "Authenticated users can upload their own avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload their own avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can view their own avatars" ON storage.objects;
CREATE POLICY "Authenticated users can view their own avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can update their own avatars" ON storage.objects;
CREATE POLICY "Authenticated users can update their own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can delete their own avatars" ON storage.objects;
CREATE POLICY "Authenticated users can delete their own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Harden check_rate_limit: ignore p_user_id parameter, always use auth.uid()
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid, p_endpoint text, p_max_requests integer, p_window_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
  v_window_start timestamptz;
  v_uid uuid;
BEGIN
  -- Always use the authenticated caller's uid, never trust p_user_id
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT request_count, window_start INTO v_count, v_window_start
  FROM public.rate_limits
  WHERE user_id = v_uid AND endpoint = p_endpoint;

  IF NOT FOUND OR (now() - v_window_start) > (p_window_seconds || ' seconds')::interval THEN
    INSERT INTO public.rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (v_uid, p_endpoint, 1, now())
    ON CONFLICT (user_id, endpoint) DO UPDATE
    SET request_count = 1, window_start = now();
    RETURN true;
  ELSIF v_count < p_max_requests THEN
    UPDATE public.rate_limits
    SET request_count = request_count + 1
    WHERE user_id = v_uid AND endpoint = p_endpoint;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$function$;
