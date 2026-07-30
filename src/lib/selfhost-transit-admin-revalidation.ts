import "server-only";

import { revalidatePath } from "next/cache";
import { clearTransitStationsCache } from "@/lib/api-transit-db";
import { prewarmPublicPaths, revalidateApiTransitPublicPaths } from "@/lib/public-revalidation";

export async function clearSelfhostTransitAdminCaches(request: Request): Promise<string[]> {
  clearTransitStationsCache();
  revalidatePath("/admin");

  const publicPaths = revalidateApiTransitPublicPaths();
  await prewarmPublicPaths(request, publicPaths);
  return publicPaths;
}
