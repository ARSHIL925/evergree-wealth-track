import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

function AuthPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

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
      const { error } = await supabase.auth.signInWithPassword(parsed);
      if (error) throw error;
      toast.success("Welcome back!");
      nav({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally { setLoading(false); }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const parsed = credsSchema.parse({ email: fd.get("email"), password: fd.get("password"), display_name: fd.get("display_name") || undefined });
      const { error } = await supabase.auth.signUp({
        email: parsed.email,
        password: parsed.password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { display_name: parsed.display_name } },
      });
      if (error) throw error;
      fetch("/api/public/hooks/new-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.email, display_name: parsed.display_name }),
      }).catch(() => {});
      toast.success("Account created! Check your inbox if email confirmation is required.");
      nav({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-up failed");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) { toast.error(r.error.message || "Google sign-in failed"); setLoading(false); return; }
    if (r.redirected) return;
    nav({ to: "/dashboard" });
  };

  return (
    <div className="gradient-hero relative flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/60 shadow-soft">
        <CardContent className="p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft"><Sprout className="h-6 w-6" /></span>
            <h1 className="font-display text-2xl">Welcome to Evergreen</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in or create your account.</p>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>Continue with Google</Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
          </div>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="signin">Sign in</TabsTrigger><TabsTrigger value="signup">Sign up</TabsTrigger></TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="mt-4 space-y-3">
                <div className="space-y-1.5"><Label htmlFor="si-email">Email</Label><Input id="si-email" name="email" type="email" required autoComplete="email" /></div>
                <div className="space-y-1.5"><Label htmlFor="si-pw">Password</Label><Input id="si-pw" name="password" type="password" required autoComplete="current-password" /></div>
                <Button type="submit" disabled={loading} className="mt-2 w-full">{loading ? "Signing in…" : "Sign in"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-4 space-y-3">
                <div className="space-y-1.5"><Label htmlFor="su-name">Display name</Label><Input id="su-name" name="display_name" required maxLength={80} /></div>
                <div className="space-y-1.5"><Label htmlFor="su-email">Email</Label><Input id="su-email" name="email" type="email" required autoComplete="email" /></div>
                <div className="space-y-1.5"><Label htmlFor="su-pw">Password</Label><Input id="su-pw" name="password" type="password" required minLength={8} autoComplete="new-password" /></div>
                <Button type="submit" disabled={loading} className="mt-2 w-full">{loading ? "Creating…" : "Create account"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}