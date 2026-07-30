import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "登录暂未开放",
  description: "当前自托管版本暂未开放用户登录。",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f7f9f9]">
      <SiteHeader />
      <section className="mx-auto flex max-w-[520px] px-4 pb-16 pt-10 sm:px-8">
        <div className="w-full border border-[var(--color-border)] bg-white p-5">
          <p className="font-mono text-[0.68rem] uppercase text-[var(--color-text-soft)]">Account</p>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--color-text-primary)]">登录暂未开放</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
            当前自托管版本先保留公开展示和后台维护能力，暂不接入用户注册、登录和账号中心。
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center justify-center border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)]"
          >
            返回首页
          </Link>
        </div>
      </section>
    </main>
  );
}
