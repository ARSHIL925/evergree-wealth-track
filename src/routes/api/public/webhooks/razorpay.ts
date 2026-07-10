import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/webhooks/razorpay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook not configured", { status: 503 });
        const sig = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const a = Buffer.from(sig); const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) return new Response("Bad signature", { status: 401 });
        const payload = JSON.parse(body) as { event: string; payload?: { payment?: { entity?: { order_id?: string; id?: string; status?: string } } } };
        const ent = payload.payload?.payment?.entity;
        if (ent?.order_id) {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("payments").update({
            status: ent.status === "captured" ? "paid" : ent.status ?? "updated",
            razorpay_payment_id: ent.id ?? null,
          }).eq("razorpay_order_id", ent.order_id);
        }
        return new Response("ok");
      },
    },
  },
});