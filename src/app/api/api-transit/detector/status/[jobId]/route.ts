import { authRequiredResponse } from "@/lib/auth";

export function GET() {
  return authRequiredResponse("当前自托管版本暂未开放登录检测报告。");
}
