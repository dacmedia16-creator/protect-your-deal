-- Helper function to check if a user is active
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT ativo FROM profiles WHERE user_id = _user_id),
    true
  )
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.is_user_active IS 'Returns true if user is active (ativo=true in profiles), defaults to true if no profile found';
