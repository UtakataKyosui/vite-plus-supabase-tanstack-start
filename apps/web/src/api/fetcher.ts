import { createIsomorphicFn } from "@tanstack/react-start";
import { appendResponseHeader, getRequest } from "@tanstack/react-start/server";

const API_PREFIX = "/api";

export class ApiError<TBody = unknown> extends Error {
  readonly status: number;
  readonly body: TBody;

  constructor(status: number, body: TBody) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type ErrorType<TBody> = ApiError<TBody>;

// During SSR there is no browser origin or cookie jar, so the request is sent
// back to this server's own origin with the incoming request's cookies.
const buildRequest = createIsomorphicFn()
  .server((url: string, options: RequestInit): [string, RequestInit] => {
    const incoming = getRequest();
    const headers = new Headers(options.headers);
    const cookie = incoming.headers.get("cookie");
    if (cookie && !headers.has("cookie")) headers.set("cookie", cookie);

    const origin = new URL(incoming.url).origin;
    if (!headers.has("origin")) headers.set("origin", origin);
    return [`${origin}${API_PREFIX}${url}`, { ...options, headers }];
  })
  .client((url: string, options: RequestInit): [string, RequestInit] => [
    `${API_PREFIX}${url}`,
    { ...options, credentials: "include" },
  ]);

// A token refreshed while serving the loopback request would otherwise be lost,
// because its Set-Cookie only reaches this server, not the browser.
const forwardSetCookie = createIsomorphicFn()
  .server((response: Response) => {
    for (const cookie of response.headers.getSetCookie()) {
      appendResponseHeader("set-cookie", cookie);
    }
  })
  .client((_response: Response) => {});

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();
  if (contentType.startsWith("text/")) return response.text();
  return response.blob();
}

export async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(...buildRequest(url, options));
  forwardSetCookie(response);
  const body = await parseBody(response);

  if (!response.ok) throw new ApiError(response.status, body);
  return body as T;
}
