/**
 * 根级路由加载骨架屏。
 * 所有页面均为服务端取数，导航期间 Next.js 会挂载本组件，
 * 用与页面一致的设计语言（#f7f8fb 底 / slate 色阶 / 圆角卡片）避免白屏卡顿感。
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] px-5 py-6 text-slate-950 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* 顶部操作区骨架 */}
        <div className="flex justify-end gap-2">
          <div className="h-9 w-28 animate-pulse rounded-md bg-slate-200" />
          <div className="h-9 w-20 animate-pulse rounded-md bg-slate-200" />
        </div>

        {/* 标题区骨架 */}
        <div className="flex flex-col gap-3">
          <div className="h-7 w-48 animate-pulse rounded-md bg-slate-200" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-slate-100" />
        </div>

        {/* 指标卡骨架 */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-7 w-16 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>

        {/* 主内容区骨架 */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-lg border border-slate-200 bg-white lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-lg border border-slate-200 bg-white" />
        </div>
      </div>
    </main>
  );
}
