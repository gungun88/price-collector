import "server-only";

import type { TransitStation } from "@/data/api-transit/types";
import { seedStations } from "@/data/api-transit/stations";
import { getRuntimeEnv } from "@/lib/runtime-env";
import {
  readTransitStationFromSelfhostBySlug,
  readTransitStationsFromSelfhost,
} from "@/lib/selfhost-transit-public";

let cached: TransitStation[] | null = null;
let cachedAt = 0;
const cachedBySlug = new Map<string, { station: TransitStation; cachedAt: number }>();

const CACHE_TTL_MS = 30_000;

export type TransitStationsSnapshotRefreshResult = {
  generatedAt: string;
  snapshotWritten: boolean;
  slugs: string[];
  stationCount: number;
};

export function clearTransitStationsCache(): void {
  cached = null;
  cachedAt = 0;
  cachedBySlug.clear();
}

export async function refreshTransitStationsSnapshot(): Promise<TransitStationsSnapshotRefreshResult> {
  const generatedAt = new Date().toISOString();
  const stations = await readTransitStationsFromSelfhost();
  setTransitStationsCache(stations, new Date(generatedAt).getTime());

  return {
    generatedAt,
    snapshotWritten: false,
    slugs: stations.map((station) => station.slug),
    stationCount: stations.length,
  };
}

export async function getTransitStations(): Promise<TransitStation[]> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;

  try {
    const stations = await readTransitStationsFromSelfhost();
    setTransitStationsCache(stations, now);
    return stations;
  } catch (error) {
    console.warn("API transit self-hosted read failed:", error);
  }

  const staleMemory = cached && cached.length ? cached : null;
  const fallback = filterStaticDemoTransitStations(staleMemory || []);
  if (fallback.length) {
    setTransitStationsCache(fallback, now);
    return fallback;
  }

  const demoFallback = staticTransitDemoFallbackStations("self-hosted API read failed");
  setTransitStationsCache(demoFallback, now);
  return demoFallback;
}

export async function getTransitStationBySlug(
  slug: string,
  options: { includeHistory?: boolean } = {},
): Promise<TransitStation | undefined> {
  const cachedStation = getCachedStationBySlug(slug);
  if (!options.includeHistory && cachedStation) return cachedStation;

  try {
    const station = await readTransitStationFromSelfhostBySlug(slug);
    if (station) {
      cacheStationLookup(station, Date.now(), slug);
      return station;
    }
  } catch (error) {
    console.warn(`API transit self-hosted detail read failed for ${slug}:`, error);
  }

  return getTransitStationFallbackBySlug(slug);
}

export async function getTransitStationDetailData(station: TransitStation): Promise<TransitStation> {
  return station;
}

function setTransitStationsCache(stations: TransitStation[], cachedAtValue = Date.now()): void {
  cached = stations;
  cachedAt = cachedAtValue;
  cachedBySlug.clear();
  for (const station of cached) {
    cacheStationLookup(station, cachedAt);
  }
}

function cacheStationLookup(station: TransitStation, cachedAtValue: number, ...aliases: string[]): void {
  for (const key of [station.slug, station.id, ...aliases]) {
    if (key) cachedBySlug.set(key, { station, cachedAt: cachedAtValue });
  }
}

async function getTransitStationFallbackBySlug(slug: string): Promise<TransitStation | undefined> {
  const cachedStation = getCachedStationBySlug(slug, { allowStale: true });
  if (cachedStation) return cachedStation;

  return findTransitStationBySlug(staticTransitDemoFallbackStations("station detail fallback is unavailable"), slug);
}

function getCachedStationBySlug(
  slug: string,
  options: { allowStale?: boolean } = {},
): TransitStation | undefined {
  const now = Date.now();
  if (cached && (options.allowStale || now - cachedAt < CACHE_TTL_MS)) {
    return findTransitStationBySlug(cached, slug);
  }
  const entry = cachedBySlug.get(slug);
  if (!entry || (!options.allowStale && now - entry.cachedAt >= CACHE_TTL_MS)) return undefined;
  return entry.station;
}

function findTransitStationBySlug(stations: TransitStation[], slug: string): TransitStation | undefined {
  return stations.find((item) => item.slug === slug || item.id === slug);
}

function filterStaticDemoTransitStations(stations: TransitStation[]): TransitStation[] {
  if (shouldUseStaticTransitDemoFallback()) return stations;
  return stations.filter((station) => !isStaticDemoTransitStation(station));
}

function isStaticDemoTransitStation(station: TransitStation): boolean {
  const riskLabels = Array.isArray(station.riskLabels) ? station.riskLabels : [];
  return station.id.startsWith("stn-") || riskLabels.includes("sample_data");
}

function staticTransitDemoFallbackStations(reason: string): TransitStation[] {
  if (shouldUseStaticTransitDemoFallback()) return seedStations;
  console.warn(`API transit ${reason}; returning empty public data instead of static demo stations.`);
  return [];
}

function shouldUseStaticTransitDemoFallback(): boolean {
  const override = getRuntimeEnv("PRICEAI_ENABLE_API_TRANSIT_SEED_FALLBACK")?.trim().toLowerCase();
  if (override === "1" || override === "true" || override === "yes") return true;
  if (override === "0" || override === "false" || override === "no") return false;
  return process.env.NODE_ENV !== "production";
}
