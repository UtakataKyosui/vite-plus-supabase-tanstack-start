const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

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

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();
  if (contentType.startsWith("text/")) return response.text();
  return response.blob();
}

export async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    credentials: "include",
  });
  const body = await parseBody(response);

  if (!response.ok) throw new ApiError(response.status, body);
  return body as T;
}
