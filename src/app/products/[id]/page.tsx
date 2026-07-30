import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductOffersPanel } from "@/components/ProductOffersPanel";
import { SiteHeader } from "@/components/SiteHeader";
import { publicCatalogProducts } from "@/lib/catalog";
import { getPublicProductSummary, listPublicProductOffers } from "@/lib/data";
import { PUBLIC_OFFER_DEFAULT_LIMIT } from "@/lib/public-offer-query";
import { formatRelativeTime } from "@/lib/utils";

export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return publicCatalogProducts().map((product) => ({ id: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getPublicProductSummary(id);

  if (!product) return { title: "商品详情" };

  return {
    title: `${product.displayName} 卡网报价`,
    description: `${product.displayName} 的渠道报价、库存、来源、价格、更新时间和风险反馈。`,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getPublicProductSummary(id);

  if (!product) notFound();

  const initialOffers = await listPublicProductOffers(product.id, {
    limit: PUBLIC_OFFER_DEFAULT_LIMIT,
    offset: 0,
  });

  return (
    <div className="priceai-square-ui min-h-screen bg-[#050505] text-[#f5f5f5]">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/95 backdrop-blur-xl">
        <SiteHeader activeSection="channels" maxWidthClassName="max-w-[1500px]" variant="dark" />
      </div>

      <main className="mx-auto max-w-[1500px] px-5 pb-10 pt-4 sm:px-8 md:pb-14 md:pt-6">
        <Link
          href="/channels"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 font-mono text-xs font-semibold text-[#c9c9c9] transition hover:border-white/24 hover:bg-white/10 hover:text-[#f5f5f5]"
        >
          <ArrowLeft size={14} />
          返回卡网订阅比价
        </Link>

        <section className="mt-5 rounded-lg bg-[#f7f9f9] p-4 text-[#202829] shadow-[0_22px_70px_rgba(0,0,0,0.22)] ring-1 ring-white/10 md:p-5">
          <div className="flex flex-col gap-2 border-b border-[#dfe5e6] pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-normal text-[#202829]">渠道报价表</h2>
              <p className="mt-1 text-sm text-[#5a6061]">
                {initialOffers.total} 条报价 · {product.inStockCount} 有货 · 按有货优先和低价排序
              </p>
            </div>
            <p className="font-mono text-xs text-[#7a8587]">
              最近记录 {formatRelativeTime(product.latestSeenAt)}
            </p>
          </div>

          <ProductOffersPanel
            productId={product.id}
            productSlug={product.slug}
            productName={product.displayName}
            initialCount={initialOffers.total || product.offerCount}
            initialData={initialOffers}
            hideFeedback
            hideFeatureFilters
          />
        </section>
      </main>
    </div>
  );
}
