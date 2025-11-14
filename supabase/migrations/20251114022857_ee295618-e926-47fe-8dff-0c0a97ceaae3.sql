-- Create exercise categories enum
CREATE TYPE public.exercise_category AS ENUM (
  'beine',
  'waden', 
  'squats',
  'po',
  'brust',
  'ruecken',
  'core',
  'schulter',
  'trizeps',
  'bizeps',
  'bauch'
);

-- Create body part enum for grouping
CREATE TYPE public.body_part AS ENUM ('lower_body', 'upper_body');

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_de TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_de TEXT,
  description_en TEXT,
  category exercise_category NOT NULL,
  body_part body_part NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workout_logs table
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL DEFAULT 1,
  reps INTEGER NOT NULL DEFAULT 1,
  weight DECIMAL(6,2), -- in kg or lbs
  unit TEXT DEFAULT 'kg',
  notes TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercises (public read)
CREATE POLICY "Anyone can view exercises"
  ON public.exercises
  FOR SELECT
  USING (true);

-- RLS Policies for workout_logs (user-specific)
CREATE POLICY "Users can view their own workout logs"
  ON public.workout_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs"
  ON public.workout_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs"
  ON public.workout_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs"
  ON public.workout_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Insert sample exercises (5 per category)
-- Lower Body - Beine
INSERT INTO public.exercises (name_de, name_en, description_de, description_en, category, body_part) VALUES
('Kniebeugen', 'Squats', 'Grundübung für die Oberschenkel', 'Basic exercise for thighs', 'beine', 'lower_body'),
('Beinpresse', 'Leg Press', 'Maschinelle Übung für die Beine', 'Machine exercise for legs', 'beine', 'lower_body'),
('Ausfallschritte', 'Lunges', 'Funktionelle Beinübung', 'Functional leg exercise', 'beine', 'lower_body'),
('Beinstrecker', 'Leg Extension', 'Isolation der Oberschenkel', 'Thigh isolation', 'beine', 'lower_body'),
('Beinbeuger', 'Leg Curl', 'Übung für hintere Oberschenkel', 'Hamstring exercise', 'beine', 'lower_body');

-- Lower Body - Waden
INSERT INTO public.exercises (name_de, name_en, description_de, description_en, category, body_part) VALUES
('Wadenheben stehend', 'Standing Calf Raise', 'Stehende Wadenübung', 'Standing calf exercise', 'waden', 'lower_body'),
('Wadenheben sitzend', 'Seated Calf Raise', 'Sitzende Wadenübung', 'Seated calf exercise', 'waden', 'lower_body'),
('Einbeiniges Wadenheben', 'Single Leg Calf Raise', 'Einseitige Wadenübung', 'Unilateral calf exercise', 'waden', 'lower_body'),
('Wadenpresse', 'Calf Press', 'Wadenpresse an der Maschine', 'Machine calf press', 'waden', 'lower_body'),
('Donkey Calf Raises', 'Donkey Calf Raises', 'Gebeugte Wadenübung', 'Bent over calf raise', 'waden', 'lower_body');

-- Lower Body - Squats
INSERT INTO public.exercises (name_de, name_en, description_de, description_en, category, body_part) VALUES
('Klassische Kniebeuge', 'Classic Squat', 'Grundlegende Kniebeuge', 'Basic squat', 'squats', 'lower_body'),
('Goblet Squat', 'Goblet Squat', 'Kniebeuge mit Gewicht vor der Brust', 'Squat with weight at chest', 'squats', 'lower_body'),
('Bulgarian Split Squat', 'Bulgarian Split Squat', 'Einbeinige Kniebeuge', 'Single leg squat', 'squats', 'lower_body'),
('Sumo Squat', 'Sumo Squat', 'Breite Kniebeuge', 'Wide stance squat', 'squats', 'lower_body'),
('Front Squat', 'Front Squat', 'Kniebeuge mit Stange vorne', 'Front barbell squat', 'squats', 'lower_body');

-- Lower Body - Po
INSERT INTO public.exercises (name_de, name_en, description_de, description_en, category, body_part) VALUES
('Hip Thrust', 'Hip Thrust', 'Hüftheben für den Po', 'Hip raise for glutes', 'po', 'lower_body'),
('Glute Bridge', 'Glute Bridge', 'Brücke für den Po', 'Bridge for glutes', 'po', 'lower_body'),
('Kickbacks', 'Kickbacks', 'Bein-Rückkicks', 'Leg kickbacks', 'po', 'lower_body'),
('Side Leg Raises', 'Side Leg Raises', 'Seitliches Beinheben', 'Side leg lifts', 'po', 'lower_body'),
('Donkey Kicks', 'Donkey Kicks', 'Esel-Kicks für den Po', 'Donkey kicks for glutes', 'po', 'lower_body');

-- Upper Body - Brust
INSERT INTO public.exercises (name_de, name_en, description_de, description_en, category, body_part) VALUES
('Bankdrücken', 'Bench Press', 'Grundübung für die Brust', 'Basic chest exercise', 'brust', 'upper_body'),
('Schrägbankdrücken', 'Incline Bench Press', 'Obere Brust', 'Upper chest', 'brust', 'upper_body'),
('Fliegende', 'Chest Fly', 'Isolation der Brust', 'Chest isolation', 'brust', 'upper_body'),
('Liegestütze', 'Push-ups', 'Körpergewichtsübung', 'Bodyweight exercise', 'brust', 'upper_body'),
('Kabelzug Brust', 'Cable Chest Press', 'Brust am Kabelzug', 'Cable chest exercise', 'brust', 'upper_body');

-- Upper Body - Rücken
INSERT INTO public.exercises (name_de, name_en, description_de, description_en, category, body_part) VALUES
('Klimmzüge', 'Pull-ups', 'Grundübung für den Rücken', 'Basic back exercise', 'ruecken', 'upper_body'),
('Kreuzheben', 'Deadlift', 'Komplexe Rückenübung', 'Complex back exercise', 'ruecken', 'upper_body'),
('Rudern', 'Rows', 'Ruderbewegung', 'Rowing movement', 'ruecken', 'upper_body'),
('Latziehen', 'Lat Pulldown', 'Lat-Übung', 'Lat exercise', 'ruecken', 'upper_body'),
('Reverse Flys', 'Reverse Flys', 'Hintere Schulter/Rücken', 'Rear delts/back', 'ruecken', 'upper_body');

-- Upper Body - Core
INSERT INTO public.exercises (name_de, name_en, description_de, description_en, category, body_part) VALUES
('Plank', 'Plank', 'Unterarmstütz', 'Forearm plank', 'core', 'upper_body'),
('Side Plank', 'Side Plank', 'Seitlicher Unterarmstütz', 'Side forearm plank', 'core', 'upper_body'),
('Mountain Climbers', 'Mountain Climbers', 'Bergsteiger', 'Mountain climbers', 'core', 'upper_body'),
('Russian Twists', 'Russian Twists', 'Russische Drehungen', 'Russian twists', 'core', 'upper_body'),
('Dead Bug', 'Dead Bug', 'Käferübung', 'Dead bug exercise', 'core', 'upper_body');

-- Upper Body - Schulter
INSERT INTO public.exercises (name_de, name_en, description_de, description_en, category, body_part) VALUES
('Schulterdrücken', 'Shoulder Press', 'Schulterübung', 'Shoulder exercise', 'schulter', 'upper_body'),
('Seitheben', 'Lateral Raises', 'Seitliches Schulterheben', 'Side shoulder raise', 'schulter', 'upper_body'),
('Frontheben', 'Front Raises', 'Vorderes Schulterheben', 'Front shoulder raise', 'schulter', 'upper_body'),
('Arnold Press', 'Arnold Press', 'Arnold-Schulterdrücken', 'Arnold shoulder press', 'schulter', 'upper_body'),
('Face Pulls', 'Face Pulls', 'Gesichtszüge', 'Face pulls', 'schulter', 'upper_body');

-- Upper Body - Trizeps
INSERT INTO public.exercises (name_de, name_en, description_de, description_en, category, body_part) VALUES
('Trizepsdrücken', 'Tricep Pushdown', 'Trizeps am Kabel', 'Cable tricep exercise', 'trizeps', 'upper_body'),
('Dips', 'Dips', 'Parallelbarren-Dips', 'Parallel bar dips', 'trizeps', 'upper_body'),
('Überkopf Trizeps', 'Overhead Tricep Extension', 'Trizeps über Kopf', 'Overhead tricep', 'trizeps', 'upper_body'),
('Kickbacks Trizeps', 'Tricep Kickbacks', 'Trizeps-Kickbacks', 'Tricep kickbacks', 'trizeps', 'upper_body'),
('Diamond Push-ups', 'Diamond Push-ups', 'Enge Liegestütze', 'Close grip push-ups', 'trizeps', 'upper_body');

-- Upper Body - Bizeps
INSERT INTO public.exercises (name_de, name_en, description_de, description_en, category, body_part) VALUES
('Bizeps Curls', 'Bicep Curls', 'Klassische Bizeps-Curls', 'Classic bicep curls', 'bizeps', 'upper_body'),
('Hammer Curls', 'Hammer Curls', 'Hammer-Curls', 'Hammer curls', 'bizeps', 'upper_body'),
('Konzentration Curls', 'Concentration Curls', 'Konzentrations-Curls', 'Concentration curls', 'bizeps', 'upper_body'),
('Preacher Curls', 'Preacher Curls', 'Scott-Curls', 'Preacher curls', 'bizeps', 'upper_body'),
('21s', '21s', '21er Bizeps-Übung', '21s bicep exercise', 'bizeps', 'upper_body');

-- Upper Body - Bauch
INSERT INTO public.exercises (name_de, name_en, description_de, description_en, category, body_part) VALUES
('Crunches', 'Crunches', 'Bauchpressen', 'Abdominal crunches', 'bauch', 'upper_body'),
('Beinheben', 'Leg Raises', 'Beinheben liegend', 'Lying leg raises', 'bauch', 'upper_body'),
('Bicycle Crunches', 'Bicycle Crunches', 'Fahrrad-Crunches', 'Bicycle crunches', 'bauch', 'upper_body'),
('Sit-ups', 'Sit-ups', 'Klassische Sit-ups', 'Classic sit-ups', 'bauch', 'upper_body'),
('Toe Touches', 'Toe Touches', 'Zehen berühren', 'Toe touches', 'bauch', 'upper_body');

-- Create index for better query performance
CREATE INDEX idx_workout_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX idx_workout_logs_exercise_id ON public.workout_logs(exercise_id);
CREATE INDEX idx_workout_logs_completed_at ON public.workout_logs(completed_at);
CREATE INDEX idx_exercises_category ON public.exercises(category);
CREATE INDEX idx_exercises_body_part ON public.exercises(body_part);