import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvergreenLogo } from "@/components/EvergreenLogo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Evergreen Wealth Track" },
      { name: "description", content: "Sign in or create an account on Evergreen Wealth Track." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const credsSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  display_name: z.string().trim().min(1).max(80).optional(),
});

const emailOnlySchema = z.object({
  email: z.string().trim().email().max(255),
});

function AuthPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/dashboard" });
    });
  }, [nav]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const parsed = credsSchema.parse({ email: fd.get("email"), password: fd.get("password") });
      const { data, error } = await supabase.auth.signInWithPassword(parsed);
      if (error) {
        const msg = error.message || "";
        if (/confirm|verif/i.test(msg)) {
          setUnverifiedEmail(parsed.email);
          toast.error("Please verify your email first. Check your inbox for the confirmation link.");
          return;
        }
        throw error;
      }
      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        setUnverifiedEmail(parsed.email);
        toast.error("Please verify your email first. Check your inbox for the confirmation link.");
        return;
      }
      toast.success("Welcome back!");
      nav({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const parsed = credsSchema.parse({
        email: fd.get("email"),
        password: fd.get("password"),
        display_name: fd.get("display_name") || undefined,
      });
      const { data, error } = await supabase.auth.signUp({
        email: parsed.email,
        password: parsed.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { display_name: parsed.display_name },
        },
      });
      if (error) throw error;
      fetch("/api/public/hooks/new-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.email, display_name: parsed.display_name }),
      }).catch(() => {});
      if (data.session) {
        toast.success("Account created!");
        nav({ to: "/dashboard" });
      } else {
        setUnverifiedEmail(parsed.email);
        toast.success("Account created! Check your inbox to verify your email before signing in.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) {
      toast.error(r.error.message || "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (r.redirected) return;
    nav({ to: "/dashboard" });
  };

  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const parsed = emailOnlySchema.parse({ email: fd.get("email") });
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent. Check your inbox.");
      setForgotOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!unverifiedEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: unverifiedEmail,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      toast.success("Verification email resent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-hero relative flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/60 shadow-soft">
        <CardContent className="p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <EvergreenLogo className="mb-3 h-14 w-14" />
            <h1 className="font-display text-2xl">Welcome to Evergreen</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in or create your account.</p>
          </div>

          {unverifiedEmail && (
            <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <p className="font-medium">Please verify your email</p>
              <p className="mt-1 text-muted-foreground">
                We sent a confirmation link to <span className="font-medium">{unverifiedEmail}</span>.
              </p>
              <Button
                type="button"
                variant="link"
                className="mt-1 h-auto p-0 text-sm"
                onClick={resendVerification}
                disabled={loading}
              >
                Resend verification email
              </Button>
            </div>
          )}

          {forgotOpen ? (
            <form onSubmit={handleForgot} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="fp-email">Email</Label>
                <Input id="fp-email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
                Continue with Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
              </div>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="mt-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="si-email">Email</Label>
                      <Input id="si-email" name="email" type="email" required autoComplete="email" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="si-pw">Password</Label>
                        <button
                          type="button"
                          onClick={() => setForgotOpen(true)}
                          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input id="si-pw" name="password" type="password" required autoComplete="current-password" />
                    </div>
                    <Button type="submit" disabled={loading} className="mt-2 w-full">
                      {loading ? "Signing in…" : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="mt-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="su-name">Display name</Label>
                      <Input id="su-name" name="display_name" required maxLength={80} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="su-email">Email</Label>
                      <Input id="su-email" name="email" type="email" required autoComplete="email" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="su-pw">Password</Label>
                      <Input
                        id="su-pw"
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="mt-2 w-full">
                      {loading ? "Creating…" : "Create account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="underline-offset-4 hover:underline">
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
