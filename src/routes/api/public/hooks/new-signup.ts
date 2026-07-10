import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({ email: z.string().email(), display_name: z.string().max(120).optional() });

export const Route = createFileRoute("/api/public/hooks/new-signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const requiredSecret = process.env.SIGNUP_HOOK_SECRET;
          const providedSecret = request.headers.get("x-hook-secret");
          if (!requiredSecret) {
            return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }
          const { timingSafeEqual } = await import("crypto");
          const a = Buffer.from(providedSecret ?? "", "utf8");
          const b = Buffer.from(requiredSecret, "utf8");
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }
          const body = Body.parse(await request.json());
          const adminEmail = process.env.ADMIN_EMAIL;
          if (adminEmail) {
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              await (supabaseAdmin.rpc as unknown as (n: string, a: Record<string, unknown>) => Promise<unknown>)("enqueue_email", {
                p_template_name: "admin-new-signup",
                p_recipient_email: adminEmail,
                p_template_data: { email: body.email, display_name: body.display_name },
              });
            } catch (e) { console.warn("[new-signup] email enqueue skipped:", e); }
          }
          return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
          return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "bad request" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});