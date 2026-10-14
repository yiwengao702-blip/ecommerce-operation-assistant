import {
  Activity,
  ArrowRight,
  Boxes,
  Building2,
  ClipboardList,
  Database,
  Download,
  FileText,
  ImageIcon,
  Layers,
  Megaphone,
  Package,
  Store as StoreIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { ProductCreateForm } from "@/components/product-create-form";
import { StoreCreateForm } from "@/components/store-create-form";
import { getCurrentUser, getProducts, getStores } from "@/lib/api";
import { getAuthToken } from "@/lib/session";
import type { Platform, Product, Store } from "@/types";

const platformLabels: Record<Platform, string> = {
  douyin: "抖音",
  taobao: "淘宝",
  tmall: "天猫",
  pinduoduo: "拼多多",
  jd: "京东",
  tiktok_shop: "TikTok",
  amazon: "Amazon",
  other: "其他",
};

const platformFilters: Array<{ value: "all" | Platform; label: string }> = [
  { value: "all", label: "全部平台" },
  { value: "douyin", label: "抖音" },
  { value: "taobao", label: "淘宝" },
  { value: "tmall", label: "天猫" },
  { value: "pinduoduo", label: "拼多多" },
  { value: "jd", label: "京东" },
];

const workflow = [
  { title: "建店建档", icon: Building2, tone: "bg-brand-50 text-brand-600", href: "/" },
  { title: "导入数据", icon: ClipboardList, tone: "bg-sky-50 text-sky-600", href: "/imports" },
  { title: "补商品信息", icon: ImageIcon, tone: "bg-emerald-50 text-emerald-600", href: "/?workflow=product" },
  { title: "投放建议", icon: Megaphone, tone: "bg-amber-50 text-amber-600", href: "/?workflow=ads" },
  { title: "周期复盘", icon: FileText, tone: "bg-rose-50 text-rose-600", href: "/?workflow=review" },
];

type HomeProps = {
  searchParams?: Promise<{ platform?: string; store?: string; demo?: string }>;
};

/** 渲染首页页面；在服务端加载业务数据，并把交互交给对应表单或客户端组件。 */
export default async function Home({ searchParams }: HomeProps) {
  const query = searchParams ? await searchParams : {};
  const selectedPlatform = parsePlatform(query.platform);
  const selectedStoreId = parseStoreId(query.store);
  // 首页聚合商品、店铺和当前用户权限；写操作入口只在 canEdit 为 true 时展示。
  const [products, stores, token] = await Promise.all([getProducts(), getStores(), getAuthToken()]);
  const currentUser = token ? await getCurrentUser(token) : null;
  const canEdit = Boolean(currentUser?.permissions.can_edit);

  const storeById = new Map(stores.map((store) => [store.id, store]));
  const productsByStore = countProductsByStore(products);
  const activeStores = stores.filter((store) => store.status === "active").length;
  const platformCount = new Set([...stores.map((store) => store.platform), ...products.map((product) => product.platform)]).size;
  const unboundProducts = products.filter((product) => product.store_id === null).length;
  const workflowItems = buildHomeWorkflow(products, stores, unboundProducts);
  const filteredProducts = products.filter((product) => {
    if (selectedPlatform !== "all" && product.platform !== selectedPlatform) {
      return false;
    }
    if (selectedStoreId !== null && product.store_id !== selectedStoreId) {
      return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 lg:px-10">
        {/* 顶部概览：把品牌标题与核心指标并置，形成企业级首屏的「封面」质感 */}
        <header className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface p-7 shadow-card lg:p-9">
          {/* 柔光装饰层：品牌蓝 + 克制金，提升层次而不喧宾夺主 */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl"></div>
            <div className="absolute -bottom-28 left-1/4 h-56 w-56 rounded-full bg-gold-400/10 blur-3xl"></div>
          </div>
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow">Ecommerce Operation Assistant</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                多平台店铺运营工作台
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                把商品、店铺、库存与投放收敛到同一张桌面，让每一次多平台运营都有据可依。
              </p>
              <span
                aria-hidden="true"
                className="mt-5 block h-1 w-16 rounded-full bg-gradient-to-r from-brand-700 to-gold-400"
              ></span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[600px]">
              <MetricCard icon={StoreIcon} label="店铺" value={stores.length} tone="bg-brand-50 text-brand-600" />
              <MetricCard
                icon={Activity}
                label="活跃店铺"
                value={activeStores}
                tone="bg-emerald-50 text-emerald-600"
              />
              <MetricCard icon={Package} label="商品" value={products.length} tone="bg-brand-50 text-brand-600" />
              <MetricCard icon={Layers} label="平台" value={platformCount} tone="bg-gold-400/15 text-gold-600" />
            </div>
          </div>
        </header>

        {/* 演示与导入：统一为一张信息条，右侧动作按钮保持清晰的层级 */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-5 shadow-card lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-brand-500">
              <Database className="h-4 w-4" aria-hidden="true" />
              <span className="eyebrow">演示和导入</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              用演示数据快速跑通店铺、库存、投放实验和复盘链路，或下载绩效数据导入模板。
            </p>
            {query.demo === "created" ? (
              <p className="mt-2 text-xs font-medium text-emerald-700">演示数据已准备好。</p>
            ) : null}
            {query.demo === "failed" ? (
              <p className="mt-2 text-xs font-medium text-rose-700">演示数据创建失败，请确认当前账号有编辑权限。</p>
            ) : null}
            {!canEdit ? (
              <p className="mt-2 text-xs font-medium text-amber-700">当前账号为只读权限，只能查看数据，不能创建或导入。</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <form action="/workspace/demo-data" method="post">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-gradient-to-r from-brand-700 to-brand-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:from-brand-600 hover:to-brand-700 hover:shadow-card-hover active:translate-y-px"
                >
                  <Database className="h-4 w-4" aria-hidden="true" />
                  生成演示数据
                </button>
              </form>
            ) : null}
            <Link
              href="/workspace/templates/performance-records"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-700"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              下载导入模板
            </Link>
            {canEdit ? (
              <Link
                href="/imports"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-700"
              >
                <Package className="h-4 w-4" aria-hidden="true" />
                导入中心
              </Link>
            ) : null}
          </div>
        </section>

        <section className={`grid gap-6 ${canEdit ? "xl:grid-cols-[380px_1fr]" : ""}`}>
          {canEdit ? (
            <div className="flex flex-col gap-6">
              <div className="panel p-6">
                <StoreCreateForm />
              </div>
              <div className="panel p-6">
                <ProductCreateForm stores={stores} />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-6">
            {/* 店铺视图：先按平台筛选，再看店铺卡片与未绑定商品提醒 */}
            <section className="panel p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-brand-500">
                    <StoreIcon className="h-4 w-4" aria-hidden="true" />
                    <span className="eyebrow">店铺视图</span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">按平台和店铺归拢商品</h2>
                  <p className="mt-1 text-sm text-slate-500">先把多平台运营入口铺出来，再逐层补全商品信息。</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {platformFilters.map((platform) => (
                    <Link
                      key={platform.value}
                      href={platform.value === "all" ? "/" : `/?platform=${platform.value}`}
                      className={`inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition ${
                        selectedPlatform === platform.value
                          ? "border-brand-700 bg-brand-700 text-white shadow-sm"
                          : "border-border-strong bg-surface text-slate-600 hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-700"
                      }`}
                    >
                      {platform.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {stores.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-strong px-4 py-10 text-center text-sm text-slate-500">
                    还没有店铺，先在左侧创建一个平台店铺。
                  </div>
                ) : (
                  stores.map((store) => (
                    <StoreSummaryCard
                      key={store.id}
                      store={store}
                      productCount={productsByStore.get(store.id) ?? 0}
                      selected={store.id === selectedStoreId}
                    />
                  ))
                )}
                {unboundProducts > 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                        <Package className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">未绑定店铺商品</p>
                        <p className="mt-1 text-xs text-amber-800">{unboundProducts} 个商品需要补店铺归属</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            {/* 商品池：轻量表格承载商品主数据，进入单品运营闭环 */}
            <section className="panel p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-brand-500">
                    <Boxes className="h-4 w-4" aria-hidden="true" />
                    <span className="eyebrow">商品池</span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">单品运营闭环</h2>
                  <p className="mt-1 text-sm text-slate-500">围绕每个商品补竞品、出素材、做投放实验和复盘。</p>
                </div>
                <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-surface-muted px-3 text-xs font-medium text-slate-600 ring-1 ring-border-subtle">
                  <Boxes className="h-3.5 w-3.5" aria-hidden="true" />
                  {filteredProducts.length} / {products.length}
                </span>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-border-subtle">
                <div className="hidden grid-cols-[1.3fr_0.9fr_0.8fr_0.7fr_1fr_96px] bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
                  <span>商品</span>
                  <span>店铺</span>
                  <span>平台</span>
                  <span>售价</span>
                  <span>卖点</span>
                  <span>动作</span>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="px-4 py-12 text-center text-sm text-slate-500">
                    当前筛选下没有商品，可以新建商品或切换平台。
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle">
                    {filteredProducts.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        store={product.store_id ? storeById.get(product.store_id) : null}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>

        {/* 运营工作流：五步闭环，用数量与提示引导下一步动作 */}
        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {workflow.map((item) => {
            const Icon = item.icon;
            const workflowItem = workflowItems.get(item.title);
            return (
              <Link
                key={item.title}
                href={workflowItem?.href ?? item.href}
                className="panel p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.tone}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-border-subtle">
                    {workflowItem?.count ?? 0}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{workflowItem?.hint ?? "查看下一步"}</p>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}

/** 构建首页工作流，从现有业务数据推导稳定的页面展示模型，不在渲染阶段修改源数据。 */
function buildHomeWorkflow(products: Product[], stores: Store[], unboundProducts: number): Map<string, { count: number; hint: string; href: string }> {
  // 工作流卡片只用已有数据提示下一步，不自动创建诊断、素材或投放实验。
  const missingSellingPoints = products.filter((product) => product.selling_points.length === 0).length;
  const missingPlatformIds = products.filter((product) => !product.external_product_id).length;
  const productsReadyForOps = products.filter((product) => product.store_id !== null && product.selling_points.length > 0).length;

  return new Map([
    [
      "建店建档",
      {
        count: stores.length + products.length,
        hint: unboundProducts > 0 ? `${unboundProducts} 个商品待绑定店铺` : "店铺和商品入口",
        href: "/",
      },
    ],
    [
      "导入数据",
      {
        count: missingPlatformIds,
        hint: missingPlatformIds > 0 ? `${missingPlatformIds} 个商品待补平台 ID` : "导入商品/SKU/经营数据",
        href: "/imports",
      },
    ],
    [
      "补商品信息",
      {
        count: missingSellingPoints,
        hint: missingSellingPoints > 0 ? `${missingSellingPoints} 个商品待补卖点` : "进入单品运营闭环",
        href: firstProductHref(products, "overview"),
      },
    ],
    [
      "投放建议",
      {
        count: productsReadyForOps,
        hint: productsReadyForOps > 0 ? "从素材和链接生成投放建议" : "先补商品基础信息",
        href: firstProductHref(products, "ads"),
      },
    ],
    [
      "周期复盘",
      {
        count: products.length,
        hint: products.length > 0 ? "回填经营数据后生成复盘" : "先创建商品",
        href: firstProductHref(products, "review"),
      },
    ],
  ]);
}

/** 首个商品链接，从现有业务数据推导稳定的页面展示模型，不在渲染阶段修改源数据。 */
function firstProductHref(products: Product[], tab: string): string {
  return products[0] ? `/products/${products[0].id}?tab=${tab}` : "/";
}

/** 渲染 MetricCard 组件，集中展示指标卡片所需的数据、状态和操作入口。 */
function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <div className="group rounded-xl border border-border-subtle bg-surface-muted px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

/** 渲染 StoreSummaryCard 组件，集中展示店铺汇总卡片所需的数据、状态和操作入口。 */
function StoreSummaryCard({
  store,
  productCount,
  selected,
}: {
  store: Store;
  productCount: number;
  selected: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 transition ${
        selected
          ? "border-brand-300 bg-brand-50/60 shadow-card"
          : "border-border-subtle bg-surface hover:border-brand-200 hover:shadow-card-hover"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <StoreIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{store.name}</p>
            <p className="mt-1 text-xs text-slate-500">{platformLabels[store.platform]}</p>
          </div>
        </div>
        <span
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            store.status === "active"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-surface-muted text-slate-600 ring-1 ring-border-subtle"
          }`}
        >
          {store.status === "active" ? "启用" : store.status === "paused" ? "暂停" : "关闭"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">商品数</p>
          <p className="mt-1 font-semibold text-foreground">{productCount}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">负责人</p>
          <p className="mt-1 truncate font-semibold text-foreground">{store.owner_name ?? "-"}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          href={`/?store=${store.id}`}
          className="inline-flex h-8 items-center rounded-md border border-border-strong bg-surface px-3 text-xs font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-700"
        >
          筛选商品
        </Link>
        <Link
          href={`/stores/${store.id}`}
          className="inline-flex h-8 items-center rounded-md bg-gradient-to-r from-brand-700 to-brand-800 px-3 text-xs font-medium text-white shadow-sm transition hover:from-brand-600 hover:to-brand-700"
        >
          店铺详情
        </Link>
      </div>
    </div>
  );
}

/** 渲染 ProductRow 组件，集中展示商品行所需的数据、状态和操作入口。 */
function ProductRow({ product, store }: { product: Product; store: Store | null | undefined }) {
  return (
    <div className="grid gap-3 px-4 py-4 text-sm transition hover:bg-brand-50/40 lg:min-h-16 lg:grid-cols-[1.3fr_0.9fr_0.8fr_0.7fr_1fr_96px] lg:items-center lg:gap-0 lg:py-3">
      <div>
        <p className="font-medium text-foreground">{product.name}</p>
        <p className="mt-1 text-xs text-slate-500">{product.category ?? "未分类"}</p>
      </div>
      <span className="text-slate-600">{store?.name ?? "未绑定"}</span>
      <span className="text-slate-600">{platformLabels[product.platform]}</span>
      <span className="font-medium text-foreground">{product.price ? `¥${product.price}` : "-"}</span>
      <div className="flex flex-wrap gap-1.5">
        {product.selling_points.slice(0, 3).map((point) => (
          <span key={point} className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
            {point}
          </span>
        ))}
      </div>
      <Link
        href={`/products/${product.id}`}
        className="inline-flex h-9 w-24 items-center justify-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 text-xs font-medium text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"
      >
        进入
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

/** 统计商品by店铺，封装当前页面重复使用的转换或展示规则，并统一处理空值边界。 */
function countProductsByStore(products: Product[]): Map<number, number> {
  return products.reduce((counts, product) => {
    if (product.store_id !== null) {
      counts.set(product.store_id, (counts.get(product.store_id) ?? 0) + 1);
    }
    return counts;
  }, new Map<number, number>());
}

/** 解析平台，把不可信表单或 JSON 值转换为页面逻辑可安全使用的类型。 */
function parsePlatform(value: string | undefined): "all" | Platform {
  // URL 筛选参数做白名单校验，避免无效平台值影响服务端渲染结果。
  if (!value || value === "all") {
    return "all";
  }
  return Object.hasOwn(platformLabels, value) ? (value as Platform) : "all";
}

/** 解析店铺ID，把不可信表单或 JSON 值转换为页面逻辑可安全使用的类型。 */
function parseStoreId(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const storeId = Number(value);
  return Number.isInteger(storeId) && storeId > 0 ? storeId : null;
}
