import { Store } from "lucide-react";
import Image from "next/image";
import type { MerchantSourcePlatformId } from "@/lib/merchant-collectors";
import type { MerchantCollectorGroup } from "@/lib/types";

export function CollectorSourceLogo({
  group,
  platformId,
  size = "card",
}: {
  group: MerchantCollectorGroup;
  platformId?: MerchantSourcePlatformId | null;
  size?: "card" | "table" | "compact";
}) {
  const frameClassName = collectorLogoFrameClassName(size);
  const imageClassName = size === "compact"
    ? "h-5 w-5 shrink-0 object-contain"
    : size === "table"
      ? "h-7 w-7 shrink-0 object-contain"
      : "h-8 w-8 shrink-0 object-contain";
  const logo = collectorSourceLogoAsset(group, platformId);

  if (logo) {
    return (
      <span aria-hidden="true" className={`${frameClassName} ${logo.frameClassName}`}>
        <Image src={logo.src} alt="" aria-hidden="true" width={32} height={32} className={imageClassName} />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={`${frameClassName} ${collectorGenericFrameClassName(group)}`}>
      <CollectorSourceGlyph size={size} />
    </span>
  );
}

function collectorLogoFrameClassName(size: "card" | "table" | "compact"): string {
  if (size === "compact") return "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1";
  if (size === "table") return "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1";
  return "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1";
}

function collectorSourceLogoAsset(
  group: MerchantCollectorGroup,
  platformId?: MerchantSourcePlatformId | null,
): { src: string; frameClassName: string } | null {
  if (platformId === "yunmaoConsignment") return { src: "/brand-icons/collector-yunmao.png", frameClassName: "bg-[#eef3f8] ring-[#c8d8e5]" };
  if (platformId === "qxvx") return { src: "/brand-icons/collector-qxvx.png", frameClassName: "bg-[#edf7f1] ring-[#b9dfc8]" };
  if (platformId === "liandongShop") return { src: "/brand-icons/collector-ldxp.png", frameClassName: "bg-[#fff5ec] ring-[#ffd9bd]" };
  if (group === "dujiao") return { src: "/brand-icons/collector-dujiao.png", frameClassName: "bg-[#f8f8f8] ring-[#adb3b4]/20" };
  if (group === "kami") return { src: "/brand-icons/collector-kami.png", frameClassName: "bg-[#fff4f4] ring-[#ffd0d2]" };
  return null;
}

function collectorGenericFrameClassName(group: MerchantCollectorGroup): string {
  if (group === "shopApi") return "bg-[#f2f4f4] text-[#5a6061] ring-[#adb3b4]/15";
  return "bg-[#f2f4f4] text-[#5a6061] ring-[#adb3b4]/15";
}

function CollectorSourceGlyph({
  size,
}: {
  size: "card" | "table" | "compact";
}) {
  return <Store size={size === "compact" ? 14 : size === "table" ? 18 : 19} />;
}
