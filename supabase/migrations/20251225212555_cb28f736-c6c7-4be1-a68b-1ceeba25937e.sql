-- Fix all RLS policies to only allow authenticated users (remove anon access)

-- Drop and recreate policies for body_analysis
DROP POLICY IF EXISTS "Users can delete their own body analysis" ON public.body_analysis;
DROP POLICY IF EXISTS "Users can update their own body analysis" ON public.body_analysis;
DROP POLICY IF EXISTS "Users can view their own body analysis" ON public.body_analysis;
DROP POLICY IF EXISTS "Users can insert their own body analysis" ON public.body_analysis;

CREATE POLICY "Authenticated users can view their own body analysis" ON public.body_analysis FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own body analysis" ON public.body_analysis FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own body analysis" ON public.body_analysis FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own body analysis" ON public.body_analysis FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Drop and recreate policies for food_analysis
DROP POLICY IF EXISTS "Users can delete their own food analysis" ON public.food_analysis;
DROP POLICY IF EXISTS "Users can update their own food analysis" ON public.food_analysis;
DROP POLICY IF EXISTS "Users can view their own food analysis" ON public.food_analysis;
DROP POLICY IF EXISTS "Users can insert their own food analysis" ON public.food_analysis;

CREATE POLICY "Authenticated users can view their own food analysis" ON public.food_analysis FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own food analysis" ON public.food_analysis FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own food analysis" ON public.food_analysis FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own food analysis" ON public.food_analysis FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Drop and recreate policies for jogging_logs
DROP POLICY IF EXISTS "Users can delete their own jogging logs" ON public.jogging_logs;
DROP POLICY IF EXISTS "Users can update their own jogging logs" ON public.jogging_logs;
DROP POLICY IF EXISTS "Users can view their own jogging logs" ON public.jogging_logs;
DROP POLICY IF EXISTS "Users can insert their own jogging logs" ON public.jogging_logs;

CREATE POLICY "Authenticated users can view their own jogging logs" ON public.jogging_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own jogging logs" ON public.jogging_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own jogging logs" ON public.jogging_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own jogging logs" ON public.jogging_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Drop and recreate policies for nutrition_logs
DROP POLICY IF EXISTS "Users can delete their own nutrition logs" ON public.nutrition_logs;
DROP POLICY IF EXISTS "Users can update their own nutrition logs" ON public.nutrition_logs;
DROP POLICY IF EXISTS "Users can view their own nutrition logs" ON public.nutrition_logs;
DROP POLICY IF EXISTS "Users can insert their own nutrition logs" ON public.nutrition_logs;

CREATE POLICY "Authenticated users can view their own nutrition logs" ON public.nutrition_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own nutrition logs" ON public.nutrition_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own nutrition logs" ON public.nutrition_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own nutrition logs" ON public.nutrition_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Drop and recreate policies for profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Drop and recreate policies for rate_limits
DROP POLICY IF EXISTS "Users can delete their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can update their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can view own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can insert their own rate limits" ON public.rate_limits;

CREATE POLICY "Authenticated users can view their own rate limits" ON public.rate_limits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own rate limits" ON public.rate_limits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own rate limits" ON public.rate_limits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own rate limits" ON public.rate_limits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Drop and recreate policies for subscriptions
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;

CREATE POLICY "Authenticated users can view their own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all subscriptions" ON public.subscriptions FOR ALL TO authenticated USING ((auth.uid() = user_id) OR (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text));

-- Drop and recreate policies for weight_logs
DROP POLICY IF EXISTS "Users can delete their own weight logs" ON public.weight_logs;
DROP POLICY IF EXISTS "Users can update their own weight logs" ON public.weight_logs;
DROP POLICY IF EXISTS "Users can view their own weight logs" ON public.weight_logs;
DROP POLICY IF EXISTS "Users can insert their own weight logs" ON public.weight_logs;

CREATE POLICY "Authenticated users can view their own weight logs" ON public.weight_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own weight logs" ON public.weight_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own weight logs" ON public.weight_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own weight logs" ON public.weight_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Drop and recreate policies for workout_logs
DROP POLICY IF EXISTS "Users can delete their own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can update their own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can view their own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can insert their own workout logs" ON public.workout_logs;

CREATE POLICY "Authenticated users can view their own workout logs" ON public.workout_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own workout logs" ON public.workout_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own workout logs" ON public.workout_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own workout logs" ON public.workout_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix exercises policy - public read is intentional for exercises list
DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
CREATE POLICY "All users can view exercises" ON public.exercises FOR SELECT TO authenticated USING (true);