-- Restore EXECUTE on has_role for authenticated users. RLS policies invoke
-- this function as the querying user, so it must be executable by them.
-- Keep it revoked from PUBLIC and anon.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;