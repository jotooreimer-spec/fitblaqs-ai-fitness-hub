-- 1. Clean up duplicate storage policies on avatars bucket
DROP POLICY IF EXISTS "Authenticated users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;

-- Recreate a single policy per operation
CREATE POLICY "Avatar select own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar insert own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 2. Add INSERT policy on body_analysis
CREATE POLICY "Users can insert their own body analysis"
ON public.body_analysis FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Add DELETE policy on profiles
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE TO authenticated
USING (auth.uid() = user_id);