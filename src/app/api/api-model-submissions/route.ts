import { disabledFeatureResponse } from "@/lib/disabled-features";

export function POST() {
  return disabledFeatureResponse("当前自托管版本暂未开放官方 API 渠道提交，后续会接入自托管后台。");
}
