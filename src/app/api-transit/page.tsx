import type { Metadata } from "next";
import { getTransitStations } from "@/lib/api-transit-db";
import { getTransitModelFamilyOptions } from "@/lib/api-transit";
import { compactTransitStationsForList } from "@/lib/api-transit";
import TransitStationExplorer from "@/components/TransitStationExplorer";
import { JsonLd } from "@/components/JsonLd";
import { ApiTransitPageShell } from "@/components/ApiTransitPageShell";

export const metadata: Metadata = {
  title: "API 中转站价格榜",
  description:
    "PriceAI API 中转站价格榜 — 对比 ChatGPT、Claude、Gemini、Grok、GLM、DeepSeek、图片生成、视频生成等中转站的充值系数、模型倍率、综合倍率、近 7 日稳定性和来源渠道。不售卖 API，不替商家担保。",
  alternates: { canonical: "/api-transit" },
  openGraph: {
    title: "API 中转站价格榜：倍率、稳定性、来源渠道 | PriceAI",
    description:
      "对比 API 中转站的主流文本、图片、视频模型综合倍率、站点稳定性和来源渠道，适合小额试用前筛选。",
  },
};

export const revalidate = 300;

export default async function ApiTransitPage() {
  const rankingReferenceAt = new Date().toISOString();
  const stations = await getTransitStations();
  const familyOptions = getTransitModelFamilyOptions();
  const listStations = compactTransitStationsForList(stations);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "API 中转站价格榜",
            description:
              "PriceAI API 中转站价格榜 — 整理已发布的第三方 API 中转站真实信息，包括充值系数、模型倍率、综合倍率和稳定性。",
            url: "https://priceai.cc/api-transit",
            isPartOf: {
              "@type": "WebSite",
              name: "PriceAI",
              url: "https://priceai.cc",
            },
          },
        ]}
      />

      <ApiTransitPageShell
        familyOptions={familyOptions}
        hideHero
      >
        <TransitStationExplorer stations={listStations} rankingReferenceAt={rankingReferenceAt} />
      </ApiTransitPageShell>
    </>
  );
}
