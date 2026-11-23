import type { CookieOptions } from "@supabase/ssr";

export function isSecureRequest(request: Request): boolean {
  if (new URL(request.url).protocol === "https:") return true;
  return request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
}

export function hardenCookieOptions(
  options: CookieOptions | undefined,
  secure: boolean,
): CookieOptions {
  return { ...options, httpOnly: true, sameSite: "lax", path: "/", secure };
}
