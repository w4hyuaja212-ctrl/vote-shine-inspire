CREATE OR REPLACE FUNCTION public.current_user_admin_status()
RETURNS TABLE(is_admin boolean, user_email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_identity AS (
    SELECT
      auth.uid() AS current_user_id,
      lower(auth.jwt() ->> 'email') AS current_email
  )
  SELECT
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      CROSS JOIN current_identity ci
      WHERE ur.role = 'admin'::public.app_role
        AND (
          ur.user_id = ci.current_user_id
          OR EXISTS (
            SELECT 1
            FROM auth.users au
            WHERE au.id = ur.user_id
              AND lower(au.email) = ci.current_email
          )
        )
    ) AS is_admin,
    auth.jwt() ->> 'email' AS user_email;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_admin_status() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.current_user_admin_status() FROM anon;