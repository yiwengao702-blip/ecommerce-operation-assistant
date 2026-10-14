/**
 * 媒体与推广链接的浏览器可达基址及 URL 工具。
 *
 * 注意：这里必须使用 NEXT_PUBLIC_API_BASE_URL（浏览器可达地址），
 * 不能使用 API_INTERNAL_BASE_URL（容器内网地址）——后者出现在浏览器 HTML 里会直接 404。
 */

/** 浏览器可达的后端 API 基址，供媒体 URL 拼接与 next/image remotePatterns 对齐。 */
export const MEDIA_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

/** 绝对地址媒体URL：worker 可返回完整 URL 或后端媒体相对路径，展示层统一补齐 API 域名。 */
export function absoluteMediaUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${MEDIA_BASE_URL}${url}`;
}

/** 绝对地址图片URL：与媒体 URL 规则一致，保留语义别名，避免各页面重复定义。 */
export function absoluteImageUrl(url: string): string {
  return absoluteMediaUrl(url);
}

/** 短链推广链接URL：由短码拼出后端跳转端点，空短码返回 null 由调用方决定占位。 */
export function shortPromotionLinkUrl(shortCode: string | null): string | null {
  if (!shortCode) {
    return null;
  }
  return `${MEDIA_BASE_URL}/api/v1/links/r/${shortCode}`;
}
