import { getCookies, getRequest, setCookie } from "@tanstack/react-start/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { hardenCookieOptions, isSecureRequest } from "./cookie-options";

export function getSupabaseServerClient() {
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
        const secure = isSecureRequest(getRequest());
        cookies.forEach(({ name, value, options }) => {
          setCookie(name, value, hardenCookieOptions(options, secure));
        });
      },
    },
  });
}
