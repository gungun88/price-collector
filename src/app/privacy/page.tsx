import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "隐私说明",
  description: "PriceAI 公开浏览、渠道提交、模型检测和数据保留说明。",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f9f9]">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-5 pb-20 pt-10 sm:px-8">
        <p className="text-sm font-semibold text-[#5a6061]">PriceAI</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#202829]">隐私说明</h1>
        <p className="mt-3 text-sm leading-7 text-[#5a6061]">
          更新时间：2026-07-30。本页说明 PriceAI 在公开浏览、渠道提交、模型检测和基础运营中处理哪些数据。
        </p>

        <PrivacySection title="公开浏览">
          搜索、比价、查看详情和阅读页面不要求注册登录。站点会记录必要的访问日志、性能日志和安全日志，用于排查故障、统计访问量和保护服务稳定。
        </PrivacySection>
        <PrivacySection title="渠道提交">
          提交渠道线索时，系统会保存你主动填写的链接、渠道名称、联系方式和备注。联系方式仅用于核对线索，不会作为公开字段展示。
        </PrivacySection>
        <PrivacySection title="模型检测">
          如果你主动使用模型检测功能，系统会保存检测目标、模型、状态、时间和结果摘要。API Key 只应用于发起检测，不应写入公开页面、分析事件或长期浏览器存储。
        </PrivacySection>
        <PrivacySection title="后台管理">
          当前后台采用自托管服务和本地管理员密码，不提供公开用户注册登录。管理员密码由服务器环境变量管理，请只在你信任的服务器环境中配置。
        </PrivacySection>
        <PrivacySection title="保留与删除">
          渠道线索、报价记录和运营日志会按维护需要保留。你可以通过站点提供的联系方式申请删除自己提交的联系方式或备注内容。
        </PrivacySection>
        <PrivacySection title="服务组件">
          PriceAI 当前以自托管后端、PostgreSQL、Next.js 前端和你配置的部署环境提供服务。请不要在提交内容或检测参数中填写与任务无关的个人敏感信息。
        </PrivacySection>

        <div className="mt-8 bg-white p-5 ring-1 ring-[#adb3b4]/15">
          <h2 className="text-lg font-semibold text-[#202829]">管理你的数据</h2>
          <p className="mt-2 text-sm leading-6 text-[#5a6061]">
            当前版本没有公开账户中心。需要处理你提交过的数据时，请提供对应链接、联系方式或提交时间，方便管理员定位。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/" className="inline-flex h-10 items-center bg-[#202829] px-4 text-sm font-semibold text-white">
              返回首页
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}

function PrivacySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-[#202829]">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#4d5657]">{children}</p>
    </section>
  );
}
