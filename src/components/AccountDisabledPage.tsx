import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export function AccountDisabledPage() {
  return (
    <main className="min-h-screen bg-[#f7f9f9]">
      <SiteHeader />
      <section className="mx-auto max-w-[680px] px-4 py-10 sm:px-8">
        <div className="border border-[var(--color-border)] bg-white p-5">
          <p className="font-mono text-[0.68rem] uppercase text-[var(--color-text-soft)]">Account</p>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--color-text-primary)]">账号中心暂未开放</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
            当前版本优先使用自托管后台维护公开报价数据，暂不提供用户登录、个人反馈记录和检测报告归属。
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
