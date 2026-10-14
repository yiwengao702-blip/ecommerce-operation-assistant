import type { NextConfig } from "next";

// 浏览器可达的后端基址：用于 next/image 的 remotePatterns 放行与媒体域名对齐。
// 只放行 /uploads/** 媒体目录，避免图片优化代理被滥用到任意地址。
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8002";
const apiUrl = new URL(apiBaseUrl);

const nextConfig: NextConfig = {
  // 允许开发服务器被 127.0.0.1 / localhost 访问：否则 Next 的 dev origin 保护会对
  // 127.0.0.1:3001 请求的 /_next/static 脚本返回 403，导致页面无法 hydrate、点击不跳转。
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  // 严格模式：开发期提前暴露副作用与过期闭包问题，不影响生产构建产物。
  reactStrictMode: true,
  // 移除 X-Powered-Type 响应头，减少技术栈指纹暴露。
  poweredByHeader: false,
  experimental: {
    // lucide-react 是 barrel 导出，开启按需导入减少构建期模块解析与树摇开销。
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    // 优先生成 AVIF/WebP：AI 生成的 1280px PNG 约 1.5MB，转 WebP 后通常压到 100~200KB。
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        // 默认端口（80/443）时 port 为空字符串，省略该字段，否则 remotePatterns 不匹配。
        ...(apiUrl.port ? { port: apiUrl.port } : {}),
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
