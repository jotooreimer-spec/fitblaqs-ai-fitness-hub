-- Drop any public-role INSERT policies on storage.objects for avatars
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload avatars" ON storage.objects;

-- Recreate strictly authenticated-only policies for the private avatars bucket
DROP POLICY IF EXISTS "Authenticated users can view own avatars" ON storage.objects;
CREATE POLICY "Authenticated users can view own avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can upload own avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can update own avatars" ON storage.objects;
CREATE POLICY "Authenticated users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can delete own avatars" ON storage.objects;
CREATE POLICY "Authenticated users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);