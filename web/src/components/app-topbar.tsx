"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  LayoutDashboard,
  Settings as SettingsIcon,
  Upload,
  Boxes,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** 顶栏用户信息的精简类型；只取展示所需字段，避免与后端完整类型强耦合。 */
export type TopbarUser = {
  display_name: string;
  permissions?: { can_edit?: boolean; can_manage_users?: boolean; can_confirm_ad_actions?: boolean };
} | null;

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "工作台",
    icon: LayoutDashboard,
    match: (p) => p === "/" || p.startsWith("/products") || p.startsWith("/stores"),
  },
  { href: "/imports", label: "导入中心", icon: Upload, match: (p) => p === "/imports" },
  { href: "/agent", label: "Agent 中心", icon: Bot, match: (p) => p.startsWith("/agent") },
  { href: "/settings", label: "模型配置", icon: SettingsIcon, match: (p) => p === "/settings" },
];

/** 渲染企业级顶栏；集中展示品牌标识、主要导航与用户菜单，统一整站导航入口。 */
export function AppTopbar({ user }: { user: TopbarUser }) {
  const pathname = usePathname();

  // 登录 / 注册页自身已是全屏品牌分屏，顶栏会与之重复，故在这些路由隐藏整条顶栏。
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-[#15264a] bg-gradient-to-r from-brand-800 to-brand-900 text-white">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-5 lg:px-8">
        {/* 品牌标识 */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
            <Boxes className="h-4 w-4 text-white" aria-hidden="true" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-gold-400 ring-2 ring-brand-900" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-wide">电商运营助手</span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-200">
              Operation Assistant
            </span>
          </span>
        </Link>

        {/* 主导航 */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition ${
                  active
                    ? "bg-white/10 text-white nav-underline-active"
                    : "text-brand-100/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 用户菜单 */}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 sm:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold ring-1 ring-white/15">
                  {user.display_name.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-sm font-medium text-brand-100">{user.display_name}</span>
              </span>
              <form action="/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-white/20 bg-white/5 px-3 text-sm font-medium text-brand-100 transition hover:bg-white/10 hover:text-white"
                >
                  退出
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-md bg-white px-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center justify-center rounded-md border border-white/20 bg-white/5 px-3 text-sm font-medium text-brand-100 transition hover:bg-white/10 hover:text-white"
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
