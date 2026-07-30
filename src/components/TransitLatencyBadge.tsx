import {
  formatTransitLatencySummary,
  getTransitLatencyTone,
  type TransitLatencyTone,
} from "@/lib/api-transit";

const latencyToneClass: Record<TransitLatencyTone, string> = {
  fast: "bg-[#e8f3ec] text-[#2f7a4b] ring-[#2f7a4b]/10",
  normal: "bg-[#eef3f8] text-[#47657a] ring-[#47657a]/10",
  slow: "bg-[#fff7e8] text-[#7a541b] ring-[#7a541b]/10",
  very_slow: "bg-[#fbe9e7] text-[#9b3328] ring-[#9b3328]/10",
  muted: "bg-[#f2f4f4] text-[#7f8889] ring-[#adb3b4]/15",
};

type TransitLatencyBadgeProps = {
  latestLatencyMs?: number | null;
  avgLatency7dMs?: number | null;
  latestLabel?: string;
  averageLabel?: string;
  prefix?: string;
  fallback?: string;
  singleLine?: boolean;
  className?: string;
};

export function TransitLatencyBadge({
  latestLatencyMs,
  avgLatency7dMs,
  latestLabel,
  averageLabel,
  prefix,
  fallback,
  singleLine = false,
  className = "",
}: TransitLatencyBadgeProps) {
  const summary = formatTransitLatencySummary(
    { latestLatencyMs, avgLatency7dMs },
    { latestLabel, averageLabel }
  );
  const toneValue = latestLatencyMs ?? avgLatency7dMs;
  const tone = getTransitLatencyTone(toneValue);
  const title = latestLatencyMs !== null && latestLatencyMs !== undefined
    ? "按最近一次有时间戳的监测请求耗时着色；≤2s 绿色，≤5s 蓝色，≤10s 黄色，>10s 红色。响应延迟不等同于首 Token 时间或 TPS。"
    : "缺少最近响应时按 7 日平均请求耗时着色；≤2s 绿色，≤5s 蓝色，≤10s 黄色，>10s 红色。响应延迟不等同于首 Token 时间或 TPS。";

  const layoutClass = singleLine
    ? "w-fit max-w-none whitespace-nowrap"
    : "max-w-full";

  if (!summary) {
    if (!fallback) return null;
    return (
      <span
        className={`inline-flex ${layoutClass} items-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-4 ring-1 ${latencyToneClass.muted} ${className}`}
      >
        {fallback}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex ${layoutClass} items-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-4 ring-1 ${latencyToneClass[tone]} ${className}`}
      title={title}
    >
      {prefix ? `${prefix}${summary}` : summary}
    </span>
  );
}
