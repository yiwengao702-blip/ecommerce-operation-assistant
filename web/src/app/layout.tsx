import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppTopbar, type TopbarUser } from "@/components/app-topbar";
import { getCurrentUser } from "@/lib/api";
import { getAuthToken } from "@/lib/session";

export const metadata: Metadata = {
  title: "万象运营台",
  description: "AI 单品运营工作台",
};

// 显式声明视口：确保移动端按设备宽度渲染且初始缩放为 1，避免老设备默认缩放导致的布局偏差。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/** 渲染 RootLayout 组件，集中展示根布局所需的数据、状态和操作入口。 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 顶栏需要当前用户用于右上角菜单；即便后端暂不可用也不应拖垮整站布局，因此失败兜底为未登录态。
  let user: TopbarUser = null;
  try {
    const token = await getAuthToken();
    if (token) {
      const currentUser = await getCurrentUser(token);
      if (currentUser) {
        user = {
          display_name: currentUser.display_name,
          permissions: currentUser.permissions,
        };
      }
    }
  } catch {
    user = null;
  }

  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AppTopbar user={user} />
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
