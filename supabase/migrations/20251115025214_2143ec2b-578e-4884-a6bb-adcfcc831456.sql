-- Create jogging_logs table for tracking running activities
CREATE TABLE public.jogging_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  distance DECIMAL(10, 2) NOT NULL, -- in kilometers
  calories INTEGER, -- calculated calories burned
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weight_logs table for tracking weight history
CREATE TABLE public.weight_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  weight DECIMAL(5, 2) NOT NULL, -- in kg
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meal type enum
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Create nutrition_logs table for tracking meals and nutrition
CREATE TABLE public.nutrition_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_type meal_type NOT NULL,
  food_name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(5, 2), -- in grams
  carbs DECIMAL(5, 2), -- in grams
  fats DECIMAL(5, 2), -- in grams
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.jogging_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jogging_logs
CREATE POLICY "Users can view their own jogging logs"
  ON public.jogging_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jogging logs"
  ON public.jogging_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jogging logs"
  ON public.jogging_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jogging logs"
  ON public.jogging_logs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for weight_logs
CREATE POLICY "Users can view their own weight logs"
  ON public.weight_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight logs"
  ON public.weight_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight logs"
  ON public.weight_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight logs"
  ON public.weight_logs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for nutrition_logs
CREATE POLICY "Users can view their own nutrition logs"
  ON public.nutrition_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition logs"
  ON public.nutrition_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition logs"
  ON public.nutrition_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition logs"
  ON public.nutrition_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_jogging_logs_user_id ON public.jogging_logs(user_id);
CREATE INDEX idx_jogging_logs_completed_at ON public.jogging_logs(completed_at DESC);
CREATE INDEX idx_weight_logs_user_id ON public.weight_logs(user_id);
CREATE INDEX idx_weight_logs_measured_at ON public.weight_logs(measured_at DESC);
CREATE INDEX idx_nutrition_logs_user_id ON public.nutrition_logs(user_id);
CREATE INDEX idx_nutrition_logs_completed_at ON public.nutrition_logs(completed_at DESC);