
-- 1. Remove overly broad avatars SELECT policy; keep folder-scoped one
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;

-- Ensure scoped SELECT policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Users can view their own avatars'
  ) THEN
    CREATE POLICY "Users can view their own avatars"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- 2. Restrict realtime.messages so users can only subscribe to topics scoped to their own uid
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive own realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated users can receive own realtime messages"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    (realtime.topic() LIKE '%' || (auth.uid())::text || '%')
  );

-- 3. Revoke public/anon execute on SECURITY DEFINER functions that should not be callable by clients
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- check_rate_limit must remain callable by authenticated users (uses auth.uid() internally)
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) TO authenticated;
