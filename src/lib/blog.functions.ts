import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  description: string;
  url: string;
  cover_image: string | null;
  reading_time_minutes: number;
  published_at: string;
  user: { name: string; profile_image: string | null };
  body_markdown?: string;
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function fetchFromDevTo(): Promise<BlogPost[]> {
  const res = await fetch("https://dev.to/api/articles?tag=personalfinance&top=30&per_page=12", {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("dev.to fetch failed");
  const raw = (await res.json()) as Array<Record<string, unknown>>;
  return raw.map((a) => ({
    id: Number(a.id),
    title: String(a.title),
    slug: String(a.slug),
    description: String(a.description ?? ""),
    url: String(a.url),
    cover_image: (a.cover_image as string) ?? null,
    reading_time_minutes: Number(a.reading_time_minutes ?? 4),
    published_at: String(a.published_at ?? a.created_at),
    user: {
      name: String(((a.user as Record<string, unknown>)?.name) ?? "Author"),
      profile_image: ((a.user as Record<string, unknown>)?.profile_image as string) ?? null,
    },
  }));
}

export const getMonthlyPosts = createServerFn({ method: "GET" }).handler(async () => {
  const month = currentMonthKey();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: cached } = await supabaseAdmin.from("blog_cache").select("*").eq("month", month).maybeSingle();
  if (cached) return { month, posts: cached.posts as unknown as BlogPost[], fetched_at: cached.fetched_at };
  try {
    const posts = await fetchFromDevTo();
    await supabaseAdmin.from("blog_cache").upsert({ month, posts: posts as unknown as never, fetched_at: new Date().toISOString() });
    return { month, posts, fetched_at: new Date().toISOString() };
  } catch {
    return { month, posts: [] as BlogPost[], fetched_at: new Date().toISOString() };
  }
});

export const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const res = await fetch(`https://dev.to/api/articles/by_path?username=&slug=${encodeURIComponent(data.slug)}`).catch(() => null);
    // fallback: scan cached posts
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const month = currentMonthKey();
    const { data: cached } = await supabaseAdmin.from("blog_cache").select("posts").eq("month", month).maybeSingle();
    const posts = (cached?.posts as unknown as BlogPost[] | undefined) ?? [];
    const match = posts.find((p) => p.slug === data.slug);
    if (match) {
      if (res && res.ok) {
        const full = (await res.json()) as { body_markdown?: string };
        return { ...match, body_markdown: full.body_markdown };
      }
      return match;
    }
    throw new Error("Post not found");
  });