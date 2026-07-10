import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getPostBySlug, type BlogPost } from "@/lib/blog.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params, loaderData }) => {
    const data = loaderData as BlogPost | undefined;
    const url = `https://solace-nest-scribe.lovable.app/blog/${params.slug}`;
    const title = data?.title ?? params.slug.replace(/-/g, " ");
    const description =
      data?.description?.slice(0, 160) ??
      "Read this curated personal finance article on Evergreen.";
    const image = data?.cover_image ?? undefined;
    return {
      meta: [
        { title: `${title} — Evergreen Blog` },
        { name: "description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }] : []),
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image ? [{ name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: data
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: data.title,
                description: data.description,
                image: data.cover_image ?? undefined,
                author: { "@type": "Person", name: data.user?.name ?? "Author" },
                publisher: {
                  "@type": "Organization",
                  name: "Evergreen Wealth Track",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://solace-nest-scribe.lovable.app/favicon.ico",
                  },
                },
                datePublished: data.published_at,
                dateModified: data.published_at,
                mainEntityOfPage: url,
                url,
              }),
            },
          ]
        : [],
    };
  },
  loader: ({ context, params }) => {
    const opts = queryOptions({ queryKey: ["blog-post", params.slug], queryFn: () => getPostBySlug({ data: { slug: params.slug } }) });
    return context.queryClient.ensureQueryData(opts);
  },
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl p-10 text-center">
      <p className="text-destructive">{error.message}</p>
      <Link to="/blog" className="mt-4 inline-block text-primary underline">Back to blog</Link>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: BlogPostPage,
});

function BlogPostPage() {
  const params = Route.useParams();
  const opts = queryOptions({ queryKey: ["blog-post", params.slug], queryFn: () => getPostBySlug({ data: { slug: params.slug } }) });
  const { data: post } = useSuspenseQuery(opts);
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/blog"><Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button></Link>
      {post.cover_image && (
        <img
          src={post.cover_image}
          alt={`Cover image for ${post.title}`}
          loading="lazy"
          decoding="async"
          className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover"
        />
      )}
      <h1 className="mt-6 font-display text-3xl md:text-4xl">{post.title}</h1>
      <div className="mt-3 text-sm text-muted-foreground">
        by {post.user.name} · {new Date(post.published_at).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })} · {post.reading_time_minutes} min read
      </div>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{post.description}</p>
      <div className="mt-8">
        <a href={post.url} target="_blank" rel="noopener noreferrer">
          <Button>Read full article <ExternalLink className="ml-2 h-4 w-4" /></Button>
        </a>
      </div>
    </article>
  );
}