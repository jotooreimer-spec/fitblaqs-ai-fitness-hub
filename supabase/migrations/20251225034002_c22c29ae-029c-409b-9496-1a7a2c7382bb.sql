-- Insert Upper Body exercises with their images
INSERT INTO public.exercises (name_de, name_en, description_de, description_en, category, body_part, image_url) VALUES
  ('Arnold Press', 'Arnold Press', 'Schulterübung mit Rotation für vollständige Entwicklung', 'Shoulder exercise with rotation for complete development', 'schulter', 'upper_body', '/exercises/upperbody/arnold-press.jpg'),
  ('Langhantel Curls', 'Barbell Curl', 'Klassische Bizeps-Übung mit der Langhantel', 'Classic biceps exercise with barbell', 'bizeps', 'upper_body', '/exercises/upperbody/barbell-curl.jpg'),
  ('Langhantel Frontheben', 'Barbell Front Raise', 'Vordere Schultermuskulatur trainieren', 'Train front deltoid muscles', 'schulter', 'upper_body', '/exercises/upperbody/barbell-front-raise.jpg'),
  ('Bankdrücken', 'Bench Press', 'Grundübung für Brust, Schultern und Trizeps', 'Compound exercise for chest, shoulders and triceps', 'brust', 'upper_body', '/exercises/upperbody/bench-press.jpg'),
  ('Kabelzug Flys', 'Cable Fly', 'Isolationsübung für die Brustmuskulatur', 'Isolation exercise for chest muscles', 'brust', 'upper_body', '/exercises/upperbody/cable-fly.jpg'),
  ('Brustpresse', 'Chest Press', 'Maschinen-Übung für die Brustmuskulatur', 'Machine exercise for chest muscles', 'brust', 'upper_body', '/exercises/upperbody/chest-press.jpg'),
  ('Enges Bankdrücken', 'Close Grip Bench Press', 'Bankdrücken mit engem Griff für Trizeps', 'Bench press with close grip for triceps', 'trizeps', 'upper_body', '/exercises/upperbody/close-grip-bench-press.jpg'),
  ('Kreuzheben', 'Deadlift', 'Grundübung für Rücken, Beine und Core', 'Compound exercise for back, legs and core', 'ruecken', 'upper_body', '/exercises/upperbody/deadlift.jpg'),
  ('Diamant Liegestütze', 'Diamond Push Ups', 'Liegestütze mit engem Griff für Trizeps', 'Push ups with close grip for triceps', 'trizeps', 'upper_body', '/exercises/upperbody/diamond-push-ups.jpg')
ON CONFLICT DO NOTHING;