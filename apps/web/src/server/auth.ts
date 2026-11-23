import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
  type CookieOptions,
} from "@supabase/ssr";
import { ConfigError, ValidationError, verifyApiKey, type AuthKind, type Principal } from "backend";
import { hardenCookieOptions, isSecureRequest } from "../utils/cookie-options";
import { apiKeyStore } from "./api-key-store";
import { isTrustedOrigin, parseAllowedOrigins, UNSAFE_METHODS } from "./origin";

interface PendingCookie {
  name: string;
  value: string;
  options: CookieOptions;
}

type AuthResult = { ok: true; principal: Principal } | { ok: false; response: Response };

export function jsonError(status: number, error: string, fields?: string): Response {
  return Response.json(fields ? { error, fields } : { error }, { status });
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : "";
}

async function authenticateSession(
  request: Request,
  pending: PendingCookie[],
): Promise<Principal | null> {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new ConfigError("SUPABASE_URL and SUPABASE_ANON_KEY are required");

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => parseCookieHeader(request.headers.get("cookie") ?? ""),
      setAll: (cookies: PendingCookie[]) => {
        pending.push(...cookies);
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { kind: "session", userId: data.user.id, email: data.user.email ?? null };
}

export async function authenticate(
  request: Request,
  allow: readonly AuthKind[],
  pending: PendingCookie[],
): Promise<AuthResult> {
  const unauthorized = { ok: false, response: jsonError(401, "unauthorized") } as const;
  const token = bearerToken(request);

  if (token !== null) {
    if (!allow.includes("apiKey")) return unauthorized;
    const principal = await verifyApiKey(apiKeyStore, token);
    return principal ? { ok: true, principal } : unauthorized;
  }

  if (!allow.includes("session")) return unauthorized;

  if (UNSAFE_METHODS.has(request.method)) {
    const extraOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
    if (!isTrustedOrigin(request, extraOrigins)) {
      return { ok: false, response: jsonError(403, "forbidden origin") };
    }
  }

  const principal = await authenticateSession(request, pending);
  return principal ? { ok: true, principal } : unauthorized;
}

function toErrorResponse(error: unknown): Response {
  if (error instanceof ValidationError) return jsonError(422, error.message, error.fields);

  console.error(error);
  return jsonError(500, "internal server error");
}

function withCookies(response: Response, pending: PendingCookie[], secure: boolean): Response {
  if (pending.length === 0) return response;

  const result = new Response(response.body, response);
  for (const { name, value, options } of pending) {
    result.headers.append(
      "set-cookie",
      serializeCookieHeader(name, value, hardenCookieOptions(options, secure)),
    );
  }
  return result;
}

export function withAuth<TContext extends { request: Request }>(
  allow: readonly AuthKind[],
  handler: (context: TContext & { principal: Principal }) => Promise<Response> | Response,
): (context: TContext) => Promise<Response> {
  return async (context) => {
    const pending: PendingCookie[] = [];

    let response: Response;
    try {
      const result = await authenticate(context.request, allow, pending);
      response = result.ok
        ? await handler({ ...context, principal: result.principal })
        : result.response;
    } catch (error) {
      response = toErrorResponse(error);
    }

    return withCookies(response, pending, isSecureRequest(context.request));
  };
}
