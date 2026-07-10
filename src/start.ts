import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Apply hardened security headers to every response.
const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next();
  const res = (result as { response?: Response }).response;
  if (res && res.headers) {
    const h = res.headers;
    if (!h.has("X-Content-Type-Options")) h.set("X-Content-Type-Options", "nosniff");
    if (!h.has("X-Frame-Options")) h.set("X-Frame-Options", "DENY");
    if (!h.has("Referrer-Policy")) h.set("Referrer-Policy", "strict-origin-when-cross-origin");
    if (!h.has("Permissions-Policy")) h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
    if (!h.has("Strict-Transport-Security")) h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    if (!h.has("Cross-Origin-Opener-Policy")) h.set("Cross-Origin-Opener-Policy", "same-origin");
    if (!h.has("X-DNS-Prefetch-Control")) h.set("X-DNS-Prefetch-Control", "off");
  }
  return result;
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [securityHeadersMiddleware, errorMiddleware],
}));
