import type { Metadata } from "next";
import { AccountDisabledPage } from "@/components/AccountDisabledPage";

export const metadata: Metadata = {
  title: "账号设置暂未开放",
  robots: { index: false, follow: false },
};

export default function AccountSettingsPage() {
  return <AccountDisabledPage />;
}
