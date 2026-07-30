import type { Metadata } from "next";
import { MdxGuidePage } from "@/components/MdxGuidePage";
import { buildMdxGuideMetadata } from "@/lib/mdx-guides";

export const dynamic = "force-static";
export const revalidate = false;

const slug = "api-transit";

export function generateMetadata(): Promise<Metadata> {
  return buildMdxGuideMetadata(slug);
}

export default function ApiTransitGuide() {
  return <MdxGuidePage slug={slug} />;
}
