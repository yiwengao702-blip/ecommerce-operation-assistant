import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { API_BASE_URL } from "@/lib/api";
import { AUTH_COOKIE_NAME } from "@/lib/session";

/** 处理注册/提交请求：校验两次密码一致后调用后端公开注册接口，成功后写入 httpOnly cookie 并自动登录。 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString() ?? "";
  const displayName = formData.get("display_name")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const confirmPassword = formData.get("confirm_password")?.toString() ?? "";

  // 两次密码不一致属于客户端可即时纠正的无效提交，直接回注册页并带错误参数，不触达后端。
  if (password !== confirmPassword) {
    redirect("/register?error=mismatch");
  }

  // 后端密码下限为 6 位；此处做一次服务端兜底校验，避免绕过前端 minLength 造成 422。
  if (password.length < 6) {
    redirect("/register?error=short");
  }

  // 网络异常（后端未启动 / 容器网络不通）用 null 兜底，便于与业务校验失败区分开。
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, display_name: displayName, password }),
  }).catch(() => null);

  if (!response) {
    redirect("/register?error=unreachable");
  }

  // 按后端状态码映射为具体错误，避免所有失败都落在一句笼统提示上。
  if (!response.ok) {
    if (response.status === 409) {
      redirect("/register?error=exists");
    }
    if (response.status === 422) {
      redirect("/register?error=invalid");
    }
    if (response.status === 429) {
      redirect("/register?error=ratelimited");
    }
    redirect("/register?error=server");
  }

  const payload = (await response.json()) as { access_token: string };
  const cookieStore = await cookies();
  // httpOnly cookie 降低 token 被客户端脚本读取的风险；注册成功后直接进入工作台。
  cookieStore.set(AUTH_COOKIE_NAME, payload.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/");
}
