import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Lock, KeyRound, ServerCog, FileCheck2, Bug, Mail } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security status — Evergreen Wealth Track" },
      { name: "description", content: "Live security posture of Evergreen: encryption, row-level isolation, security headers, dependency scanning, and how to report a vulnerability." },
      { property: "og:title", content: "Security status — Evergreen Wealth Track" },
      { property: "og:description", content: "Transparent overview of the controls Evergreen has enabled today." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://evergree-wealth-track.lovable.app/security" },
      { name: "twitter:title", content: "Security status — Evergreen" },
      { name: "twitter:description", content: "How Evergreen protects your data." },
    ],
    links: [{ rel: "canonical", href: "https://evergree-wealth-track.lovable.app/security" }],
  }),
  component: SecurityPage,
});

const controls = [
  { icon: Lock, title: "Transport encryption", body: "All traffic served over HTTPS with HSTS preload. Plain-HTTP requests are 301-redirected by the platform edge." },
  { icon: ShieldCheck, title: "Strict security headers", body: "Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, Permissions-Policy and Cross-Origin-Opener-Policy are sent on every response." },
  { icon: KeyRound, title: "Row-level isolation", body: "Every table that stores user data has Row-Level Security enabled. Policies scope each row to auth.uid() — even our own server fns can only read what the signed-in user owns." },
  { icon: ServerCog, title: "Secret handling", body: "API keys live in server-only env. Razorpay & webhook secrets are never bundled into the browser. Service-role credentials are loaded inside privileged handlers only." },
  { icon: FileCheck2, title: "Dependency scanning", body: "npm audit runs on every build. High and critical findings block ship. We track and patch advisories within 72 hours." },
  { icon: Bug, title: "Safe-by-construction code", body: "No eval() anywhere; the in-app calculator uses a custom shunting-yard parser. Webhook payloads are HMAC-verified with timing-safe equality before any DB writes." },
];

function SecurityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Trust &amp; security</p>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl">
              Security <span className="text-primary">status</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              This page is maintained by the Evergreen team to answer common questions about how we protect your data. It is not a third-party certification.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-1.5 text-sm font-medium text-success">
              <span className="h-2 w-2 rounded-full bg-success" /> All systems normal
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-4 md:grid-cols-2">
            {controls.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="border-border/60 transition-all hover:shadow-soft active:scale-[0.99]">
                <CardContent className="flex gap-4 p-6">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg">{title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 border-border/60">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent-foreground"><Mail className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-display text-lg">Report a vulnerability</h2>
                  <p className="text-sm text-muted-foreground">Send details to <a className="text-primary underline" href="mailto:security@evergreen.app">security@evergreen.app</a>. We acknowledge within 48 hours.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Shared responsibility: the controls above are enabled in the Evergreen application. Your account safety also depends on a strong, unique password and signed-out devices.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}