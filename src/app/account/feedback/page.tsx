import type { Metadata } from "next";
import { AccountDisabledPage } from "@/components/AccountDisabledPage";

export const metadata: Metadata = {
  title: "反馈记录暂未开放",
  robots: { index: false, follow: false },
};

export default function AccountFeedbackPage() {
  return <AccountDisabledPage />;
}
