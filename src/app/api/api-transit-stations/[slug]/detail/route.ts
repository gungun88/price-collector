import { NextResponse } from "next/server";
import { publicPriceApiErrorResponse } from "@/lib/api-errors";
import { noStoreCacheHeaders, publicDataCacheHeaders } from "@/lib/cache-headers";
import { getTransitStationBySlug } from "@/lib/api-transit-db";

const TRANSIT_DETAIL_EDGE_SECONDS = 600;
const TRANSIT_DETAIL_STALE_SECONDS = 1800;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const station = await getTransitStationBySlug(slug, { includeHistory: true });

    if (!station) {
      return NextResponse.json(
        {
          ok: false,
          message: "API 中转站不存在或尚未公开。",
        },
        {
          status: 404,
          headers: noStoreCacheHeaders(),
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        station,
      },
      {
        headers: publicDataCacheHeaders({
          edgeSeconds: TRANSIT_DETAIL_EDGE_SECONDS,
          staleSeconds: TRANSIT_DETAIL_STALE_SECONDS,
        }),
      }
    );
  } catch (error) {
    return publicPriceApiErrorResponse("public API transit detail API", error);
  }
}
