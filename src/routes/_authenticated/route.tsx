import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const u = data.user;
    const verified = !!u.email_confirmed_at || !!(u as { confirmed_at?: string }).confirmed_at || u.app_metadata?.provider !== "email";
    if (!verified) throw redirect({ to: "/verify-email" });
    return { user: u };
  },
  component: () => (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  ),
});