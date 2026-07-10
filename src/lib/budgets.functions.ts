import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NewBudget = z.object({
  period: z.enum(["monthly", "yearly"]),
  category: z.string().min(1).max(40),
  amount_inr: z.number().positive().max(1e10),
});

export const listBudgets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("budgets").select("*").eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => NewBudget.parse(d))
  .handler(async ({ data, context }) => {
    // If a budget already exists for this user+period+category, ADD to it.
    // Otherwise insert a fresh row.
    const { data: existing, error: selErr } = await context.supabase
      .from("budgets")
      .select("id, amount_inr")
      .eq("user_id", context.userId)
      .eq("period", data.period)
      .eq("category", data.category)
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);
    if (existing) {
      const next = Number(existing.amount_inr) + data.amount_inr;
      const { error } = await context.supabase
        .from("budgets")
        .update({ amount_inr: next })
        .eq("id", existing.id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("budgets").insert({
        user_id: context.userId,
        period: data.period,
        category: data.category,
        amount_inr: data.amount_inr,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const updateBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    amount_inr: z.number().positive().max(1e10),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("budgets")
      .update({ amount_inr: data.amount_inr })
      .eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("budgets").delete()
      .eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });