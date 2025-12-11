-- Add onboarding completion column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false;

-- Update the handle_new_user function to include the new column
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, height, weight, body_type, has_completed_onboarding)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'height')::DECIMAL,
    (NEW.raw_user_meta_data->>'weight')::DECIMAL,
    NEW.raw_user_meta_data->>'body_type',
    false
  );
  RETURN NEW;
END;
$$;