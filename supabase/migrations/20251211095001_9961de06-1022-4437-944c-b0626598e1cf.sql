-- Add RLS policies to avatars storage bucket for proper access control
-- Users can only access their own avatars

-- Policy for viewing avatars (allow users to see their own)
CREATE POLICY "Users can view their own avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for uploading avatars (allow users to upload to their own folder)
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for updating avatars (allow users to update their own)
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for deleting avatars (allow users to delete their own)
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);