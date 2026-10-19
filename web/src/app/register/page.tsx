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
  UserPlus,
  User,
} from "lucide-react";
import Link from "next/link";

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** 注册页品牌标识：与顶栏、登录页保持一致。 */
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
        <span className="text-base font-semibold tracking-wide text-foreground">万象运营台</span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-500">
          Operation Assistant
        </span>
      </span>
    </span>
  );
}

/** 渲染注册页面：企业级分屏（左侧品牌叙事 + 右侧表单卡片），服务端读取错误参数并渲染。 */
export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = (await searchParams) ?? {};
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  // 错误码 → 提示文案映射：把后端状态码差异还原成人话，避免所有失败都提示“邮箱可能已被注册”。
  const ERROR_MESSAGES: Record<string, string> = {
    mismatch: "两次输入的密码不一致，请重新确认。",
    short: "密码长度不足 6 位，请重新设置。",
    exists: "该邮箱已注册，请直接登录或更换邮箱。",
    invalid: "填写的信息不符合要求，请检查邮箱格式与密码长度（至少 6 位）。",
    ratelimited: "操作过于频繁，请稍后再试。",
    unreachable: "暂时无法连接注册服务，请稍后重试或联系管理员。",
    server: "注册服务出现异常，请稍后重试。",
  };
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "注册失败，请检查输入后重试。") : null;

  const highlights = [
    { icon: ShieldCheck, text: "注册即开通运营工作台，数据按工作区隔离" },
    { icon: BarChart3, text: "导入多平台店铺与商品，沉淀经营看板" },
    { icon: Sparkles, text: "AI 诊断、创意与投放建议开箱即用" },
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
              Create Your Workspace
            </p>
            <h2 className="mt-5 text-3xl font-semibold leading-snug tracking-tight xl:text-4xl">
              几步创建账号
              <br />
              开启智能运营
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-100/80">
              一个账号即可打通商品诊断、创意生成与投放复盘，把分散的运营动作收敛到同一个工作台。
            </p>

            <ul className="mt-9 space-y-4">
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                    <Icon className="h-4 w-4 text-gold-400" aria-hidden="true" />
                  </span>
                  <span className="text-sm leading-relaxed text-brand-50/90">{text}</span>
                </li>
              ))}
            </ul>

            {/* 玻璃拟态「经营速览」小卡：给品牌面板一个精致视觉锚点（数据为示例占位） */}
            <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-brand-900/20 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-brand-100/90">今日经营速览</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-400/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gold-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400" aria-hidden="true"></span>
                  LIVE
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-lg font-semibold leading-none text-white">32</p>
                  <p className="mt-1 text-[10px] text-brand-200/80">在售商品</p>
                </div>
                <div>
                  <p className="text-lg font-semibold leading-none text-white">98.2%</p>
                  <p className="mt-1 text-[10px] text-brand-200/80">库存健康</p>
                </div>
                <div>
                  <p className="text-lg font-semibold leading-none text-white">+36%</p>
                  <p className="mt-1 text-[10px] text-brand-200/80">周环比</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-brand-200/60">© 2026 万象运营台 · 企业级智能运营平台</p>
        </div>
      </aside>

      {/* 右侧注册表单区 */}
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* 移动端（无左侧面板）仍需品牌标识建立身份 */}
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>

          <div className="panel p-7 sm:p-8">
            <div className="flex items-center gap-2 text-brand-500">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span className="eyebrow">注册账号</span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">创建工作台账号</h1>
            <p className="mt-1.5 text-sm text-slate-500">填写信息即可开通，无需等待审核。</p>

            {errorMessage ? (
              <div className="mt-5 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <form action="/register/submit" method="post" className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">姓名 / 昵称</span>
                <span className="relative mt-2 block">
                  <User
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    name="display_name"
                    type="text"
                    required
                    autoComplete="name"
                    className="h-11 w-full rounded-md border border-border-strong bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    placeholder="运营"
                  />
                </span>
              </label>

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
                <span className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-700">密码</span>
                  <span className="text-xs text-slate-500">至少 6 位</span>
                </span>
                <span className="relative mt-2 block">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-11 w-full rounded-md border border-border-strong bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    placeholder="设置登录密码"
                  />
                </span>
              </label>

              <label className="block">
                <span className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-700">确认密码</span>
                  <span className="text-xs text-slate-500">两次输入需一致</span>
                </span>
                <span className="relative mt-2 block">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    name="confirm_password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-11 w-full rounded-md border border-border-strong bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    placeholder="再次输入密码"
                  />
                </span>
              </label>

              <button
                type="submit"
                className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-700 to-brand-800 text-sm font-semibold text-white shadow-sm transition hover:from-brand-600 hover:to-brand-700 hover:shadow-card-hover active:translate-y-px"
              >
                注册并进入
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </form>
          </div>

          <div className="mt-5 flex items-center justify-between px-1">
            <Link href="/login" className="text-sm text-slate-500 transition hover:text-brand-700">
              已有账号？登录
            </Link>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Check className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
              企业内网安全连接
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
