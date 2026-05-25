ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_athlete_level_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_athlete_level_check
CHECK (athlete_level IS NULL OR athlete_level IN ('beginner', 'intermediate', 'professional'));

UPDATE public.profiles
SET athlete_level = 'professional'
WHERE athlete_level = 'pro';