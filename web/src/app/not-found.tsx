import Link from "next/link";

/** 品牌化 404 页面：路径不存在或资源被清理时给出可操作的返回入口。 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-lg border border-border-subtle bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-brand-600">404</p>
          <h1 className="mt-2 text-xl font-semibold text-foreground">页面不存在</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            你访问的商品、店铺或页面可能已被删除，或链接已失效。
            可以返回工作台继续操作。
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
          >
            返回工作台
          </Link>
        </div>
      </div>
    </main>
  );
}
