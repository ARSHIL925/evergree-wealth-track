import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProfileSchema = z.object({
  display_name: z.string().trim().min(1).max(80).optional(),
  preferred_currency: z.string().length(3).optional(),
  upi_id: z.string().trim().max(80).optional().or(z.literal("")),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
  avatar_url: z.string().url().optional().or(z.literal("")),
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles").select("*").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileSchema.parse(d))
  .handler(async ({ data, context }) => {
    const patch = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== ""));
    const { error } = await context.supabase
      .from("profiles").update({ ...patch, updated_at: new Date().toISOString() }).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });