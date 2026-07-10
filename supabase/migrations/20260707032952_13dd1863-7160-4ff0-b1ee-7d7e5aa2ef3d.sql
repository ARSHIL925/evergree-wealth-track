REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;

DROP POLICY IF EXISTS "Users insert own subs" ON public.subscriptions;
-- Subscription rows are created only by the server after payment verification (service_role via supabaseAdmin).