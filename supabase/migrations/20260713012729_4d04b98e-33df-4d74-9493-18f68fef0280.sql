-- Restrict EXECUTE on SECURITY DEFINER functions so signed-in users cannot call them directly.
-- handle_new_user runs only from an auth trigger; has_role is used inside RLS policies and does
-- not need to be directly executable by client roles (RLS evaluates as the definer's privileges).

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Preserve service_role access for admin/maintenance paths.
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;