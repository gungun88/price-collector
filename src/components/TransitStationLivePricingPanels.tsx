"use client";

import { useEffect, useState } from "react";
import type { TransitStation } from "@/data/api-transit/types";
import {
  TransitStationPricingPanels,
  TransitStationPricingSkeleton,
} from "@/components/TransitStationDetail";

type TransitDetailResponse =
  | {
      ok: true;
      station: TransitStation;
    }
  | {
      ok: false;
      message?: string;
    };

type Props = {
  slug: string;
  initialStation: TransitStation;
};

export function TransitStationLivePricingPanels({ slug, initialStation }: Props) {
  const [station, setStation] = useState(initialStation);
  const [requestedFreshData, setRequestedFreshData] = useState(false);

  useEffect(() => {
    let active = true;

    async function refreshDetailData() {
      setStation(initialStation);
      setRequestedFreshData(false);

      try {
        const response = await fetch(`/api/api-transit-stations/${encodeURIComponent(slug)}/detail`, {
          headers: {
            accept: "application/json",
          },
        });

        if (!response.ok) return;

        const data = (await response.json()) as TransitDetailResponse;
        if (!active || !data.ok || !isTransitStationPayload(data.station)) return;

        setStation(data.station);
      } catch {
        // Keep the last known good station data on transient network or API failures.
      } finally {
        if (active) setRequestedFreshData(true);
      }
    }

    void refreshDetailData();

    return () => {
      active = false;
    };
  }, [initialStation, slug]);

  if (!station.prices.length && !requestedFreshData) {
    return <TransitStationPricingSkeleton />;
  }

  return <TransitStationPricingPanels station={station} />;
}

function isTransitStationPayload(value: unknown): value is TransitStation {
  if (!value || typeof value !== "object") return false;
  const station = value as Partial<TransitStation>;
  return typeof station.id === "string" && typeof station.slug === "string" && Array.isArray(station.prices);
}
