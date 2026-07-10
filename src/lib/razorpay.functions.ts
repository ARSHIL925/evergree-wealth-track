import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const RAZORPAY_PUBLIC_KEY_ID = (typeof process !== "undefined" ? process.env.RAZORPAY_KEY_ID : undefined) ?? "";

// Server-authoritative plan prices (INR). NEVER trust client-supplied amounts.
const PLAN_PRICES: Record<string, number> = { seed: 0, spark: 29, grow: 49, pro: 99 };
const PlanEnum = z.enum(["seed", "spark", "grow", "pro"]);

export const getRazorpayPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { key_id: process.env.RAZORPAY_KEY_ID ?? "" };
});

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    plan: PlanEnum,
    billing_cycle: z.enum(["monthly", "yearly", "one_time"]).default("monthly"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const amount_inr = PLAN_PRICES[data.plan];
    if (!amount_inr || amount_inr <= 0) throw new Error("Invalid plan");
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      // Demo mode: insert a pending payment without contacting Razorpay
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row, error } = await supabaseAdmin.from("payments").insert({
        user_id: context.userId,
        amount_inr,
        method: "card",
        status: "demo_mode",
        notes: `Demo: ${data.plan}/${data.billing_cycle}. Add RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET secrets to enable live checkout.`,
      }).select().single();
      if (error) throw new Error(error.message);
      return { demo: true, payment_id: row!.id, key_id: "", order_id: "" };
    }
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: Math.round(amount_inr * 100),
        currency: "INR",
        notes: { plan: data.plan, billing_cycle: data.billing_cycle, user_id: context.userId },
      }),
    });
    if (!orderRes.ok) throw new Error(`Razorpay order failed: ${await orderRes.text()}`);
    const order = (await orderRes.json()) as { id: string; amount: number; currency: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      amount_inr,
      method: "card",
      status: "created",
      razorpay_order_id: order.id,
      notes: `${data.plan}/${data.billing_cycle}`,
    });
    return { demo: false, order_id: order.id, key_id: keyId, amount: order.amount, currency: order.currency };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Server not configured");
    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", secret).update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`).digest("hex");
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(data.razorpay_signature, "hex");
    if (a.length === 0 || a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("Invalid signature");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Read trusted plan/amount from the server-stored payment row, scoped to user
    const { data: paymentRow, error: fetchErr } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, amount_inr, notes")
      .eq("razorpay_order_id", data.razorpay_order_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!paymentRow) throw new Error("Order not found");
    const [planFromNotes, cycleFromNotes] = String(paymentRow.notes ?? "").split("/");
    const plan = (planFromNotes || "").trim();
    const billing_cycle = (["monthly", "yearly", "one_time"] as const).includes(
      (cycleFromNotes || "").trim() as "monthly" | "yearly" | "one_time",
    ) ? ((cycleFromNotes || "").trim() as "monthly" | "yearly" | "one_time") : "monthly";
    if (!plan) throw new Error("Order missing plan");
    await supabaseAdmin.from("payments").update({
      status: "paid",
      razorpay_payment_id: data.razorpay_payment_id,
    }).eq("razorpay_order_id", data.razorpay_order_id).eq("user_id", context.userId);
    await supabaseAdmin.from("subscriptions").insert({
      user_id: context.userId,
      plan,
      amount_inr: paymentRow.amount_inr,
      billing_cycle,
      status: "active",
      started_at: new Date().toISOString(),
    });
    return { ok: true };
  });

const UpiSchema = z.object({
  upi_txn_ref: z.string().trim().min(4).max(60),
  plan: PlanEnum,
  notes: z.string().max(200).optional().or(z.literal("")),
});

export const recordUpiPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpiSchema.parse(d))
  .handler(async ({ data, context }) => {
    const amount_inr = PLAN_PRICES[data.plan];
    if (!amount_inr || amount_inr <= 0) throw new Error("Invalid plan");
    const { error } = await context.supabase.from("payments").insert({
      user_id: context.userId,
      amount_inr,
      method: "upi",
      status: "pending_verification",
      upi_txn_ref: data.upi_txn_ref,
      notes: `${data.plan}${data.notes ? " — " + data.notes : ""}`,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payments").select("*").eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listMySubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subscriptions").select("*").eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });