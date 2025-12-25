-- Add INSERT, UPDATE, DELETE policies for rate_limits table
-- Allow authenticated users to insert their own rate limit records
CREATE POLICY "Users can insert their own rate limits"
ON public.rate_limits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own rate limit records
CREATE POLICY "Users can update their own rate limits"
ON public.rate_limits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own rate limit records
CREATE POLICY "Users can delete their own rate limits"
ON public.rate_limits
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);