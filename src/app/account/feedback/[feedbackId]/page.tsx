import type { Metadata } from "next";
import { AccountDisabledPage } from "@/components/AccountDisabledPage";

export const metadata: Metadata = {
  title: "反馈详情暂未开放",
  robots: { index: false, follow: false },
};

export default function AccountFeedbackDetailPage() {
  return <AccountDisabledPage />;
}
