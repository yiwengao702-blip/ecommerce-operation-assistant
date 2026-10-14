/**
 * 商品详情路由加载骨架。
 * 商品页数据量最大（商品 + SKU + 诊断 + 创意计划 + 素材 + 任务），
 * 用贴近真实分区的骨架减少等待焦虑；根级 loading.tsx 已覆盖其余路由。
 */
export default function ProductDetailLoading() {
  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* 返回栏 + 标题区 */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-md bg-slate-200" />
          <div className="flex flex-col gap-2">
            <div className="h-6 w-56 animate-pulse rounded-md bg-slate-200" />
            <div className="h-4 w-36 animate-pulse rounded bg-surface-muted" />
          </div>
        </div>

        {/* 关键指标条 */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border-subtle bg-white p-4 shadow-sm">
              <div className="h-4 w-16 animate-pulse rounded bg-surface-muted" />
              <div className="mt-3 h-6 w-12 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>

        {/* 主内容双栏 */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-lg border border-border-subtle bg-white" />
          <div className="h-80 animate-pulse rounded-lg border border-border-subtle bg-white" />
        </div>

        {/* 创意计划区 */}
        <div className="h-64 animate-pulse rounded-lg border border-border-subtle bg-white" />
      </div>
    </main>
  );
}
