import type { Metadata } from "next";
import { AccountDisabledPage } from "@/components/AccountDisabledPage";

export const metadata: Metadata = {
  title: "检测报告暂未开放",
  robots: { index: false, follow: false },
};

export default function AccountDetectorReportsPage() {
  return <AccountDisabledPage />;
}
