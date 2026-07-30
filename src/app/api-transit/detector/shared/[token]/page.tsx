import type { Metadata } from "next";
import { DetectorReportShell } from "@/components/DetectorReportShell";
import { TransitDetectorReportUnavailable } from "@/components/TransitDetectorReport";
import { getTransitModelFamilyOptions } from "@/lib/api-transit";

export const metadata: Metadata = {
  title: "已分享的检测报告",
  description: "PriceAI API 中转模型检测报告分享页。",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function SharedDetectorReportPage() {
  return (
    <DetectorReportShell familyOptions={getTransitModelFamilyOptions()}>
      <TransitDetectorReportUnavailable
        title="分享报告暂未接入"
        message="当前自托管版本还没有接入检测报告分享存储。后续需要时可以把报告表迁移到自托管 PostgreSQL。"
      />
    </DetectorReportShell>
  );
}
