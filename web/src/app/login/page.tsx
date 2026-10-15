import {
  Boxes,
  LockKeyhole,
  Mail,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Sparkles,
  Check,
  AlertCircle,
  Play,
} from "lucide-react";
import Link from "next/link";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** 登录页品牌标识：与顶栏保持一致，避免分屏下两套品牌语言。 */
function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-white shadow-sm ring-1 ring-brand-900/10">
        <Boxes className="h-5 w-5" aria-hidden="true" />
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-gold-400 ring-2 ring-white"
          aria-hidden="true"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-semibold tracking-wide text-foreground">电商运营助手</span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-500">
          Operation Assistant
        </span>
      </span>
    </span>
  );
}

/** 渲染登录页面：企业级分屏（左侧品牌叙事 + 右侧表单卡片），服务端读取错误参数并渲染。 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  // 区分登录失败与「演示服务不可用」：后者由后端未启动触发，提示更贴合。
  const isDemoError = error === "demo";

  const highlights = [
    { icon: ShieldCheck, text: "企业级权限隔离与操作审计，数据资产更安全" },
    { icon: BarChart3, text: "多店铺经营看板，实时掌握增长与库存健康度" },
    { icon: Sparkles, text: "AI 诊断、创意与投放建议，运营决策更省心" },
  ];

  return (
    <main className="flex min-h-screen bg-background text-foreground">
      {/* 左侧品牌叙事面板：仅在中等以上屏幕展示，营造企业级首屏质感 */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 to-brand-900 text-white lg:flex lg:w-1/2 xl:w-[55%]">
        {/* 柔光装饰层，提升精致层次（显式开合标签，避免自闭合解析歧义） */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"></div>
        </div>
        <div className="relative z-10 flex w-full flex-col justify-between px-12 py-12 xl:px-16">
          <BrandMark />

          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-400">
              Intelligent Commerce Platform
            </p>
            <h2 className="mt-5 text-3xl font-semibold leading-snug tracking-tight xl:text-4xl">
              以数据与 AI 驱动的
              <br />
              电商智能运营中枢
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-100/80">
              从商品诊断、创意生成到投放复盘，把分散的运营动作收敛到一个工作台，让每一次决策都有据可依。
            </p>

            <ul className="mt-9 space-y-4">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.text} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                      <Icon className="h-4 w-4 text-gold-400" aria-hidden="true" />
                    </span>
                    <span className="text-sm leading-relaxed text-brand-50/90">{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="text-xs text-brand-200/80">© 2026 电商运营助手 · 企业级智能运营平台</p>
        </div>
      </aside>

      {/* 右侧登录表单区 */}
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* 移动端（无左侧面板）仍需品牌标识建立身份 */}
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>

          <div className="panel p-7 sm:p-8">
            <div className="flex items-center gap-2 text-brand-500">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              <span className="eyebrow">欢迎回来</span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">登录工作台</h1>
            <p className="mt-1.5 text-sm text-slate-500">使用企业账号登录，进入智能运营中枢。</p>

            {error ? (
              <div className="mt-5 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {isDemoError
                    ? "演示服务暂不可用，请确认后端已启动后再试一次。"
                    : "邮箱或密码不正确，或者账号已停用。"}
                </span>
              </div>
            ) : null}

            <form action="/login/submit" method="post" className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">邮箱</span>
                <span className="relative mt-2 block">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="h-11 w-full rounded-md border border-border-strong bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    placeholder="owner@example.com"
                  />
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">密码</span>
                <span className="relative mt-2 block">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="h-11 w-full rounded-md border border-border-strong bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    placeholder="输入密码"
                  />
                </span>
              </label>

              <button
                type="submit"
                className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-700 to-brand-800 text-sm font-semibold text-white shadow-sm transition hover:from-brand-600 hover:to-brand-700 hover:shadow-card-hover active:translate-y-px"
              >
                登录
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </form>

            {/* 一键在线演示：免密进入演示账号，浏览内置茶叶示例数据，降低首次体验门槛 */}
            <div className="mt-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-border-subtle" aria-hidden="true" />
              <span className="text-xs font-medium text-slate-500">或</span>
              <span className="h-px flex-1 bg-border-subtle" aria-hidden="true" />
            </div>

            <form action="/login/demo" method="post" className="mt-4">
              <button
                type="submit"
                className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-brand-300 bg-brand-50 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 active:translate-y-px"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                在线演示
              </button>
              <p className="mt-2 text-center text-xs text-slate-500">
                无需注册，直接体验智能运营工作台与示例数据
              </p>
            </form>
          </div>

          <div className="mt-5 flex items-center justify-between px-1">
            <Link href="/" className="text-sm text-slate-500 transition hover:text-brand-700">
              返回首页
            </Link>
            <Link href="/register" className="text-sm text-brand-600 transition hover:text-brand-700">
              还没有账号？注册
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
