import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { API_BASE_URL } from "@/lib/api";
import { AUTH_COOKIE_NAME, WORKSPACE_COOKIE_NAME } from "@/lib/session";

/** 处理一键演示登录：调用后端免密演示接口，写入会话 Cookie 后进入工作台。 */
export async function POST(request: Request) {
  // 演示登录不依赖表单密码，仅向后端演示接口换取令牌；后端不可达时降级回登录页。
  let token: string | null = null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/demo-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      const payload = (await response.json()) as { access_token: string };
      token = payload.access_token;
    }
  } catch {
    // 后端未启动或网络异常：保持 token 为空，统一走下方错误分支，避免裸 500。
    token = null;
  }

  if (!token) {
    // 注意：redirect 抛出的特殊异常不在 try 内，确保 Next.js 能正确接管跳转。
    redirect("/login?error=demo");
  }

  const cookieStore = await cookies();
  // httpOnly cookie 降低 token 被客户端脚本读取的风险；后续 API 调用由服务端统一附加 Authorization。
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  // 示例茶叶数据位于默认工作区（id=1），显式写入 workspace cookie 保证首屏落在正确租户。
  cookieStore.set(WORKSPACE_COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/");
}
