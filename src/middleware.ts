import { NextResponse, type NextRequest } from "next/server";
import { priceAiCanonicalOrigin } from "@/lib/auth-paths";

const ACTIVE_DEPLOYMENT_ID = process.env.NEXT_DEPLOYMENT_ID;
const STALE_CSS_BROWSER_SECONDS = 86_400;
const STALE_CSS_EDGE_SECONDS = 604_800;

// OpenNext 1.20.x does not yet support Next.js 16 Node Proxy bundles.
// Keep this narrowly-scoped Edge middleware until the adapter supports src/proxy.ts.
export async function middleware(request: NextRequest) {
  if (isStaleDeploymentCssRequest(request)) return staleDeploymentCssResponse();

  if (request.nextUrl.hostname.toLowerCase() === "www.priceai.cc") {
    const destination = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, priceAiCanonicalOrigin);
    return NextResponse.redirect(destination, 308);
  }

  return NextResponse.next();
}

function isStaleDeploymentCssRequest(request: NextRequest): boolean {
  if (!request.nextUrl.pathname.startsWith("/_next/static/css/")) return false;
  const requestedDeploymentId = request.nextUrl.searchParams.get("dpl");
  return Boolean(ACTIVE_DEPLOYMENT_ID && requestedDeploymentId && requestedDeploymentId !== ACTIVE_DEPLOYMENT_ID);
}

function staleDeploymentCssResponse(): Response {
  return new Response("", {
    status: 200,
    headers: {
      "Cache-Control": `public, max-age=${STALE_CSS_BROWSER_SECONDS}, s-maxage=${STALE_CSS_EDGE_SECONDS}, stale-while-revalidate=${STALE_CSS_EDGE_SECONDS}`,
      "Content-Type": "text/css; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-PriceAI-Static-Fallback": "stale-deployment-css",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const config = {
  matcher: [
    "/_next/static/css/:path*",
  ],
};
