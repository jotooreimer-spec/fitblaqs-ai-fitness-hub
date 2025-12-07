-- Add new columns to profiles table for AI key storage and pro status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_api_key TEXT,
ADD COLUMN IF NOT EXISTS ai_provider TEXT CHECK (ai_provider IN ('lovable', 'openai', 'gemini'));

-- Create body_analysis table
CREATE TABLE IF NOT EXISTS public.body_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT,
  gender TEXT,
  age_estimate INTEGER,
  body_fat_pct NUMERIC,
  muscle_mass_pct NUMERIC,
  posture TEXT,
  symmetry TEXT,
  waist_hip_ratio NUMERIC,
  fitness_level INTEGER CHECK (fitness_level >= 1 AND fitness_level <= 10),
  health_notes TEXT,
  training_tips TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create food_analysis table
CREATE TABLE IF NOT EXISTS public.food_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total_calories INTEGER,
  notes TEXT,
  category TEXT CHECK (category IN ('meat', 'protein', 'supplements', 'vegetarian', 'vegan')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.body_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies for body_analysis
CREATE POLICY "Users can view their own body analysis" ON public.body_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own body analysis" ON public.body_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own body analysis" ON public.body_analysis FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own body analysis" ON public.body_analysis FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for food_analysis
CREATE POLICY "Users can view their own food analysis" ON public.food_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own food analysis" ON public.food_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own food analysis" ON public.food_analysis FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own food analysis" ON public.food_analysis FOR DELETE USING (auth.uid() = user_id);