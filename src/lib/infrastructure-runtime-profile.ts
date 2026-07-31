export const infrastructureRuntimeProfile = {
  productionTarget: "Node.js VPS + Next.js",
  workerName: null,
  incrementalCache: "Next.js filesystem cache",
  revalidationQueue: "Next.js server runtime",
  regionalCacheMode: "short-lived",
  regionalCacheMaxAgeSeconds: 60,
  cacheInterceptionEnabled: false,
  publicAssetCacheRoutes: [
    "/api/sponsor-assets",
    "/api/api-transit/logo",
  ],
  observability: {
    enabled: true,
    successSamplingConfigured: false,
  },
} as const;

export const OPEN_NEXT_REGIONAL_CACHE_MODE = infrastructureRuntimeProfile.regionalCacheMode;
