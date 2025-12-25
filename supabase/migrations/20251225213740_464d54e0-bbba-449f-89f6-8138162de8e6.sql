-- Fix rate_limits RLS: restrict INSERT/UPDATE/DELETE to service role only, users can only SELECT
DROP POLICY IF EXISTS "Authenticated users can insert their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Authenticated users can update their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Authenticated users can delete their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Authenticated users can view their own rate limits" ON public.rate_limits;

-- Users can only view their own rate limits
CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix subscriptions RLS: separate user and service role policies
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated users can view their own subscriptions" ON public.subscriptions;

-- Users can only view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Fix storage.objects RLS: restrict to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

-- Authenticated users can view avatars (public bucket)
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
CREATE POLICY "Authenticated users can upload avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Authenticated users can update their own avatar
CREATE POLICY "Authenticated users can update avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Authenticated users can delete their own avatar
CREATE POLICY "Authenticated users can delete avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);