import type { Metadata } from "next";
import Image from "next/image";
import { CircleDollarSign, Clock3, Database, ExternalLink, MessageCircle, Scale, SearchCheck, Server, ShieldCheck, Sparkles } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/SiteHeader";
import { afdianSupportUrl, githubRepoUrl, kofiSupportUrl, paypalSupportUrl } from "@/lib/support";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "支持 PriceAI",
  description: "如果 PriceAI 帮你省过时间、少花过冤枉钱，可以通过 GitHub Star、爱发电、Ko-fi / PayPal 支持作者继续维护。",
  alternates: {
    canonical: "/support",
  },
  openGraph: {
    title: "支持 PriceAI",
    description: "支持 PriceAI 持续整理 AI 订阅、官方 API、中转 API 和卡网渠道的价格、库存与风险信息。",
    url: "https://priceai.cc/support",
    siteName: "PriceAI",
  },
};

export default function SupportPage() {
  const valueItems = [
    {
      title: "省时间",
      body: "不用在商家站点、帖子、群聊和历史记录里反复找价格。",
      icon: Clock3,
    },
    {
      title: "省金钱",
      body: "看清价格区间，减少因为渠道不透明而长期买贵、买错。",
      icon: CircleDollarSign,
    },
    {
      title: "少踩坑",
      body: "把库存、更新时间、风险提示和用户反馈放在一起看。",
      icon: ShieldCheck,
    },
    {
      title: "更中立",
      body: "个人支持不会影响排序、价格、库存或风险提示。",
      icon: Scale,
    },
  ];

  const supportUseItems = [
    {
      title: "持续整理价格与库存",
      body: "维护 AI 订阅、官方 API、中转 API 和卡网渠道的信息更新。",
      icon: SearchCheck,
    },
    {
      title: "服务器与数据成本",
      body: "支撑页面访问、数据库、图片与后续公开查询能力。",
      icon: Server,
    },
    {
      title: "反馈与风险线索",
      body: "处理用户反馈，沉淀渠道稳定性和售后相关线索。",
      icon: MessageCircle,
    },
    {
      title: "检测与工具能力",
      body: "继续完善模型检测、数据核对和后续实用工具。",
      icon: Database,
    },
  ];

  const supportCards = [
    {
      title: "GitHub Star",
      body: "0 成本支持，让更多需要比价和避坑的人看见 PriceAI。",
      actionLabel: "去 GitHub 点 Star",
      href: githubRepoUrl,
      iconSrc: "/brand-icons/github.svg",
      iconClassName: "h-6 w-6",
      active: true,
      rel: "noreferrer",
    },
    {
      title: "爱发电",
      body: "如果 PriceAI 帮你省过时间或少花过冤枉钱，可以顺手支持一杯咖啡。",
      actionLabel: afdianSupportUrl ? "打开爱发电" : "爱发电入口开通中",
      href: afdianSupportUrl,
      iconSrc: "/brand-icons/afdian.png",
      iconClassName: "h-8 w-8",
      active: Boolean(afdianSupportUrl),
      rel: "nofollow noopener noreferrer",
    },
    {
      title: "Ko-fi / PayPal",
      body: "海外用户可以通过 Ko-fi / PayPal 支持项目继续更新。",
      actionLabel: kofiSupportUrl || paypalSupportUrl ? "打开 Ko-fi" : "国际入口开通中",
      href: kofiSupportUrl || paypalSupportUrl,
      iconSrc: "/brand-icons/kofi.png",
      iconClassName: "h-8 w-8 rounded-md",
      active: Boolean(kofiSupportUrl || paypalSupportUrl),
      rel: "nofollow noopener noreferrer",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-page)] text-[var(--color-text-body)]">
      <JsonLd data={buildSupportJsonLd()} />
      <div className="sticky top-0 z-40 bg-[var(--color-page-translucent)] shadow-[var(--shadow-control)] backdrop-blur-xl">
        <SiteHeader />
      </div>

      <main>
        <section className="border-b border-[var(--color-border)]">
          <div className="mx-auto max-w-[1500px] border-x border-[var(--color-border-soft)] px-5 py-10 sm:px-8 md:py-14">
            <div className="mx-auto max-w-6xl">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-success-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-success-text)] ring-1 ring-[var(--color-border-soft)]">
                  <Sparkles size={14} />
                  减少信息差的 AI 价格工具
                </div>
                <h1 className="mt-5 text-balance text-[2rem] font-semibold leading-tight tracking-normal text-[var(--color-text-primary)] sm:text-4xl md:text-5xl">
                  少花时间找渠道，少花冤枉钱。
                </h1>
                <p className="mt-5 max-w-[72ch] text-pretty text-base leading-8 text-[var(--color-text-muted)]">
                  PriceAI 把 AI 订阅、官方 API、中转 API 和卡网渠道的信息放在一起，帮你快速看价格、库存、更新时间和风险提示。很多时候，用户不是不想省钱，而是不知道哪里贵、哪里不稳、哪里有坑。
                </p>
                <p className="mt-3 max-w-[72ch] text-pretty text-sm leading-7 text-[var(--color-text-soft)]">
                  如果 PriceAI 曾经帮你更快找到合适价格、避开不透明渠道，欢迎用一个顺手的方式支持作者继续维护。
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href="#ways"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-text-on-primary)] transition hover:bg-[var(--color-primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)]"
                  >
                    选择支持方式
                  </a>
                  <a
                    href={githubRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-text-body)] ring-1 ring-[var(--color-border-soft)] transition hover:bg-[var(--color-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)]"
                  >
                    GitHub Star
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>

              <div className="mt-9">
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">PriceAI 持续替你做的事</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {valueItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <article key={item.title} className="rounded-lg bg-[var(--color-panel)] p-5 ring-1 ring-[var(--color-border-soft)]">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-success-text)] ring-1 ring-[var(--color-border-soft)]">
                          <Icon size={18} />
                        </span>
                        <h3 className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{item.body}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="ways" className="border-b border-[var(--color-border)] bg-[var(--color-panel)]">
          <div className="mx-auto max-w-[1500px] border-x border-[var(--color-border-soft)] px-5 py-10 sm:px-8 md:py-12">
            <div className="mx-auto max-w-6xl">
              <div className="max-w-4xl">
                <h2 className="max-w-3xl text-balance text-2xl font-semibold tracking-normal text-[var(--color-text-primary)] sm:text-3xl">
                  选一个顺手的方式。
                </h2>
                <p className="mt-2 max-w-[68ch] text-sm leading-7 text-[var(--color-text-muted)]">
                  金钱支持不是必须。一次 Star、一次分享、一次有效反馈，也是在帮这个工具变得更有用。
                </p>
                <p className="mt-4 max-w-[68ch] rounded-lg bg-[var(--color-surface)] px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)] ring-1 ring-[var(--color-border-soft)]">
                  支持作者不会购买排名、推荐位或风险豁免；商业合作会单独标注。
                </p>
              </div>

              <div className="mt-8 grid gap-3 lg:grid-cols-3">
                {supportCards.map((card) => {
                  const content = (
                    <>
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-surface)] ring-1 ring-[var(--color-border-soft)]">
                        <Image
                          src={card.iconSrc}
                          alt=""
                          aria-hidden="true"
                          width={32}
                          height={32}
                          className={`shrink-0 object-contain ${card.iconClassName}`}
                        />
                      </span>
                      <h3 className="mt-5 text-lg font-semibold text-[var(--color-text-primary)]">{card.title}</h3>
                      <p className="mt-2 min-h-18 text-sm leading-6 text-[var(--color-text-muted)]">{card.body}</p>
                      <span
                        className={`mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                          card.active
                            ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-primary-hover)]"
                            : "bg-[var(--color-surface)] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border-soft)]"
                        }`}
                      >
                        {card.actionLabel}
                        {card.active ? <ExternalLink size={15} /> : null}
                      </span>
                    </>
                  );

                  return card.href ? (
                    <a
                      key={card.title}
                      href={card.href}
                      target="_blank"
                      rel={card.rel}
                      className="rounded-lg bg-[var(--color-surface-raised)] p-5 ring-1 ring-[var(--color-border-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-control)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)]"
                    >
                      {content}
                    </a>
                  ) : (
                    <article key={card.title} className="rounded-lg bg-[var(--color-surface-raised)] p-5 ring-1 ring-[var(--color-border-soft)]">
                      {content}
                    </article>
                  );
                })}
              </div>

            </div>
          </div>
        </section>

        <section className="border-b border-[var(--color-border)]">
          <div className="mx-auto max-w-[1500px] border-x border-[var(--color-border-soft)] px-5 py-10 sm:px-8 md:py-12">
            <div className="mx-auto max-w-6xl">
              <div className="max-w-4xl">
                <h2 className="text-balance text-2xl font-semibold tracking-normal text-[var(--color-text-primary)] sm:text-3xl">
                  支持会用在哪里。
                </h2>
                <p className="mt-3 max-w-[60ch] text-sm leading-7 text-[var(--color-text-muted)]">
                  PriceAI 的价值来自持续整理和校验，而不是一次性页面。支持会优先投入到能继续减少信息差的地方。
                </p>
              </div>
              <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {supportUseItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.title} className="rounded-lg bg-[var(--color-panel)] p-5 ring-1 ring-[var(--color-border-soft)]">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-text-body)] ring-1 ring-[var(--color-border-soft)]">
                        <Icon size={18} />
                      </span>
                      <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{item.body}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function buildSupportJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "支持 PriceAI",
    url: "https://priceai.cc/support",
    inLanguage: "zh-CN",
    description: "说明 PriceAI 如何帮助用户减少信息差，并提供 GitHub Star、中文打赏入口和国际打赏入口等支持方式。",
    isPartOf: {
      "@type": "WebSite",
      name: "PriceAI",
      url: "https://priceai.cc",
    },
  };
}
