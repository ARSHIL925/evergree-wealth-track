import { createFileRoute } from "@tanstack/react-router";
import { getMonthlyPosts } from "@/lib/blog.functions";

const BASE_URL = "https://evergree-wealth-track.lovable.app";
const staticEntries = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/how-it-works", priority: "0.9", changefreq: "monthly" },
  { path: "/blog", priority: "0.8", changefreq: "weekly" },
  { path: "/security", priority: "0.7", changefreq: "monthly" },
  { path: "/auth", priority: "0.4", changefreq: "yearly" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const postEntries: { path: string; priority: string; changefreq: string; lastmod?: string }[] = [];
        try {
          const { posts } = await getMonthlyPosts();
          for (const p of posts) {
            postEntries.push({
              path: `/blog/${p.slug}`,
              priority: "0.6",
              changefreq: "monthly",
              lastmod: p.published_at ? p.published_at.slice(0, 10) : today,
            });
          }
        } catch {
          // If posts can't be fetched at build time, skip dynamic entries.
        }
        const all = [...staticEntries.map((e) => ({ ...e, lastmod: today })), ...postEntries];
        const urls = all
          .map(
            (e) =>
              `  <url><loc>${BASE_URL}${e.path}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});