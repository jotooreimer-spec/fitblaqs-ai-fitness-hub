-- Remove unused columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS ai_api_key;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS ai_provider;