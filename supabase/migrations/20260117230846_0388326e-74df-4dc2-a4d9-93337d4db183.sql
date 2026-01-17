-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can read share by code" ON public.user_shares;

-- Create a secure function to lookup shares by code (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.get_share_by_code(p_share_code text)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  context text,
  linkedin_url text,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    phone,
    context,
    linkedin_url,
    expires_at
  FROM public.user_shares
  WHERE share_code = p_share_code
    AND expires_at > now();
$$;