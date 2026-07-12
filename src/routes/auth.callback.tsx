import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EvergreenLogo } from "@/components/EvergreenLogo";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing you in… — Evergreen" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OAuthCallback,
});

function OAuthCallback() {
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const go = (session: { user: { email_confirmed_at?: string | null } } | null) => {
      if (cancelled) return;
      const u = session?.user;
      if (u && !u.email_confirmed_at) {
        toast.error("Please verify your email to continue.");
        nav({ to: "/verify-email", replace: true });
        return;
      }
      toast.success("Signed in successfully");
      nav({ to: "/dashboard", replace: true });
    };

    // If a session is already hydrated, go immediately.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) return go(data.session);
    });

    // Otherwise wait for the SIGNED_IN event from the OAuth redirect.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) go(session);
    });

    // Fallback: if nothing happens in 8s, bounce back to /auth with an error.
    timeout = setTimeout(() => {
      if (cancelled) return;
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) return go(data.session);
        setError("We couldn't complete sign-in. Please try again.");
      });
    }, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, [nav]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <EvergreenLogo className="h-12 w-12" />
        {error ? (
          <>
            <p className="text-sm text-destructive">{error}</p>
            <a href="/auth" className="text-sm underline">Back to sign in</a>
          </>
        ) : (
          <>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
            <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
          </>
        )}
      </div>
    </div>
  );
}
