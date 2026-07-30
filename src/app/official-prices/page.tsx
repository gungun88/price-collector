import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { OfficialPricesExplorer } from "@/components/OfficialPricesExplorer";
import { getOfficialPricesDataset } from "@/lib/official-prices-db";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "官方订阅",
  description: "查看 ChatGPT、Claude、Gemini、Grok 等官方订阅的地区价格和人民币估算价。",
  alternates: {
    canonical: "/official-prices",
  },
};

export default async function OfficialPricesPage() {
  const dataset = await getOfficialPricesDataset();
  const regionCount = new Set(dataset.rows.map((row) => row.countryCode)).size;

  return (
    <>
      <JsonLd data={buildOfficialPricesJsonLd(dataset.apps.length, regionCount, dataset.rows.length)} />
      <OfficialPricesExplorer dataset={dataset} />
    </>
  );
}

function buildOfficialPricesJsonLd(appCount: number, regionCount: number, priceCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PriceAI 官方订阅",
    url: "https://priceai.cc/official-prices",
    inLanguage: "zh-CN",
    description: `整理 ${appCount} 个应用、${regionCount} 个地区、${priceCount} 条官方订阅地区价格。`,
  };
}
