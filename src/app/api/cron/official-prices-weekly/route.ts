import { cronMethodNotAllowed } from "@/lib/cron-auth";
import { disabledFeatureResponse } from "@/lib/disabled-features";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return cronMethodNotAllowed("官方地区价周采集任务");
}

export function POST() {
  return disabledFeatureResponse("当前自托管版本暂未接入官方地区价周采集任务。");
}
