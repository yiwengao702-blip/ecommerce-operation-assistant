"use client";

import Link from "next/link";

/**
 * 根级错误边界。
 * 服务端取数失败（后端未启动、网络中断、500）时挂载本组件，
 * 提供明确的中文提示与重试入口，避免暴露默认英文错误堆栈。
 */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#f7f8fb] px-5 py-6 text-slate-950 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-lg font-semibold text-rose-800">页面加载失败</h1>
          <p className="mt-2 text-sm text-rose-700">
            服务端数据获取出现问题，可能是后端服务暂时不可用或网络波动。
            请点击下方按钮重试；若持续失败，请检查后端 API 是否正常启动。
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-cyan-700 px-3 text-sm font-medium text-white hover:bg-cyan-800"
            >
              重试
            </button>
            <Link
              href="/"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
