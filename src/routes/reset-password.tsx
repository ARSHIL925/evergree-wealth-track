import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EvergreenLogo } from "@/components/EvergreenLogo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Evergreen Wealth Track" },
      { name: "description", content: "Choose a new password for your Evergreen account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

const pwSchema = z
  .object({
    password: z.string().min(8, "At least 8 characters").max(72),
    confirm: z.string().min(8).max(72),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

function ResetPasswordPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase places the recovery tokens in the URL hash and the client parses them
    // automatically. We just need to confirm a recovery session is present.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    // If no session appears within a short window, likely an invalid or expired link.
    const t = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) setError("This reset link is invalid or has expired. Please request a new one.");
      });
    }, 1500);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const parsed = pwSchema.parse({ password: fd.get("password"), confirm: fd.get("confirm") });
      const { error } = await supabase.auth.updateUser({ password: parsed.password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      nav({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0]?.message : err instanceof Error ? err.message : "Update failed";
      toast.error(msg ?? "Update failed");
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
            <h1 className="font-display text-2xl">Choose a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter and confirm your new password below.</p>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
              {error}
              <div className="mt-3">
                <Button asChild variant="outline" className="w-full">
                  <a href="/auth">Back to sign in</a>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pw">New password</Label>
                <Input id="pw" name="password" type="password" required minLength={8} autoComplete="new-password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw2">Confirm new password</Label>
                <Input id="pw2" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
              </div>
              <Button type="submit" disabled={loading || !ready} className="mt-2 w-full">
                {loading ? "Updating…" : ready ? "Update password" : "Waiting for reset link…"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
