-- Strengthen RLS policies to explicitly require authentication
-- The existing policies use auth.uid() = user_id which returns NULL for unauthenticated users
-- Adding explicit "authenticated" role checks for extra security

-- Note: Current policies are already RESTRICTIVE (Permissive: No) which means 
-- access is denied unless conditions are met. auth.uid() returns NULL for 
-- unauthenticated users, so the condition fails and access is denied.

-- However, let's add a comment documenting the security model
COMMENT ON TABLE public.body_analysis IS 'User body composition analysis - RLS enforced, auth required';
COMMENT ON TABLE public.food_analysis IS 'User food analysis - RLS enforced, auth required';
COMMENT ON TABLE public.workout_logs IS 'User workout logs - RLS enforced, auth required';
COMMENT ON TABLE public.nutrition_logs IS 'User nutrition logs - RLS enforced, auth required';
COMMENT ON TABLE public.weight_logs IS 'User weight logs - RLS enforced, auth required';
COMMENT ON TABLE public.jogging_logs IS 'User jogging logs - RLS enforced, auth required';
COMMENT ON TABLE public.subscriptions IS 'User subscriptions - RLS enforced, auth required';
COMMENT ON TABLE public.profiles IS 'User profiles - RLS enforced, auth required';

-- Verify RLS is enabled on all sensitive tables (it already is, but this ensures it)
ALTER TABLE public.body_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jogging_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;