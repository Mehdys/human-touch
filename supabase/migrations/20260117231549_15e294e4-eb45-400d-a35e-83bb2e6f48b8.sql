-- Add DELETE policy for catchups table
CREATE POLICY "Users can delete their own catchups"
ON public.catchups
FOR DELETE
USING (auth.uid() = user_id);

-- Replace get_share_by_code function with input validation
CREATE OR REPLACE FUNCTION public.get_share_by_code(p_share_code text)
RETURNS TABLE(id uuid, name text, phone text, context text, linkedin_url text, expires_at timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input format: 6-20 chars, alphanumeric only
  IF p_share_code IS NULL OR 
     length(p_share_code) < 6 OR 
     length(p_share_code) > 20 OR
     p_share_code !~ '^[A-Za-z0-9]+$' THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    us.id,
    us.name,
    us.phone,
    us.context,
    us.linkedin_url,
    us.expires_at
  FROM public.user_shares us
  WHERE us.share_code = p_share_code
    AND us.expires_at > now();
END;
$$;