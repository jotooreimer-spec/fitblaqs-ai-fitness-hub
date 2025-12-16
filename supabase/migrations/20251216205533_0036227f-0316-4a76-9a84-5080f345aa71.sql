-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.nutrition_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jogging_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weight_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.body_analysis;
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_analysis;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Set REPLICA IDENTITY FULL for complete row data in updates
ALTER TABLE public.nutrition_logs REPLICA IDENTITY FULL;
ALTER TABLE public.workout_logs REPLICA IDENTITY FULL;
ALTER TABLE public.jogging_logs REPLICA IDENTITY FULL;
ALTER TABLE public.weight_logs REPLICA IDENTITY FULL;
ALTER TABLE public.body_analysis REPLICA IDENTITY FULL;
ALTER TABLE public.food_analysis REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;