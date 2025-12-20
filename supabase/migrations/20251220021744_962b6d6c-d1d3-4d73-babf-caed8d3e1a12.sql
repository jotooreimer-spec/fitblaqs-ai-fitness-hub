-- Fix security issues: Make avatars bucket private and remove overly permissive RLS policy

-- 1. Make the avatars bucket private (fixes STORAGE_EXPOSURE)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'avatars';

-- 2. Drop the overly permissive policy that allows all users to view all avatars (fixes PUBLIC_DATA_EXPOSURE)
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;

-- 3. Also clean up any duplicate "Avatar images are publicly accessible" policy
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;