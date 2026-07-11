-- Lock down SECURITY DEFINER functions so signed-in users cannot execute them directly.
-- handle_new_user is a trigger on auth.users; it must never be user-callable.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role is SECURITY DEFINER and used inside RLS policies. Policies evaluate the
-- function under the invoking role, so authenticated must retain EXECUTE, but we
-- revoke the default PUBLIC/anon grants so it is not exposed via the Data API.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;