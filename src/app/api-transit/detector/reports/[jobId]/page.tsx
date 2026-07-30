import type { Metadata } from "next";
import { DetectorReportShell } from "@/components/DetectorReportShell";
import { TransitDetectorReportUnavailable } from "@/components/TransitDetectorReport";
import { getTransitModelFamilyOptions } from "@/lib/api-transit";

interface DetectorReportPageProps {
  params: Promise<{ jobId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: DetectorReportPageProps): Promise<Metadata> {
  const { jobId } = await params;
  return {
    title: `API 中转检测报告 #${jobId}`,
    description: "PriceAI API 中转检测报告。",
    alternates: { canonical: `/api-transit/detector/reports/${jobId}` },
    robots: { index: false, follow: false },
  };
}

export default async function ApiTransitDetectorReportPage() {
  return (
    <DetectorReportShell familyOptions={getTransitModelFamilyOptions()}>
      <TransitDetectorReportUnavailable
        title="检测报告暂未接入"
        message="当前自托管版本还没有接入检测报告归属和分享存储。中转 API 站点、报价和提交线索已经迁移到自托管后台。"
      />
    </DetectorReportShell>
  );
}
