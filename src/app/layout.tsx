import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const themeInitScript = `
(function() {
  try {
    var root = document.documentElement;
    var isAdmin = window.location.pathname.indexOf('/admin') === 0;
    if (isAdmin) {
      root.dataset.theme = 'light';
      root.style.colorScheme = 'light';
      return;
    }
    root.dataset.theme = 'dark';
    root.style.colorScheme = 'dark';
  } catch (error) {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.colorScheme = 'dark';
  }
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL("https://priceai.cc"),
  title: {
    default: "PriceAI | AI 价格目录",
    template: "%s | PriceAI",
  },
  description: "查看 AI 官方订阅、卡网报价、官方接口和中转 API 的价格、来源、库存与更新时间。",
  applicationName: "PriceAI",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PriceAI | AI 价格目录",
    description: "把官方订阅、卡网报价、官方接口和中转 API 整理成可搜索、可比较、可核验的购买前参考。",
    url: "https://priceai.cc",
    siteName: "PriceAI",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PriceAI | AI 价格目录",
    description: "查看 AI 订阅和接口获取方式的价格、来源、库存与更新时间。",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
  other: {
    "impact-site-verification": "5194cee0-23c8-4dc2-94e8-1a968cb8f93e",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script id="priceai-theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
