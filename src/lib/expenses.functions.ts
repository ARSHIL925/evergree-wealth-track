import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NewExpense = z.object({
  amount: z.number().positive().max(1e10),
  currency: z.string().length(3).default("INR"),
  category: z.string().min(1).max(40).default("general"),
  note: z.string().max(280).optional().or(z.literal("")),
  occurred_at: z.string().datetime().optional(),
});

export const listExpenses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("expenses").select("*").eq("user_id", context.userId)
      .order("occurred_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => NewExpense.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("expenses").insert({
      user_id: context.userId,
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      note: data.note || null,
      occurred_at: data.occurred_at ?? new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("expenses").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateExpense = z.object({
  id: z.string().uuid(),
  amount: z.number().positive().max(1e10),
  currency: z.string().length(3),
  category: z.string().min(1).max(40),
  note: z.string().max(280).optional().or(z.literal("")),
});

export const updateExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateExpense.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("expenses")
      .update({
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        note: data.note || null,
      })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });