import { describe, expect, test } from "vite-plus/test";
import { isTrustedOrigin, parseAllowedOrigins } from "./origin";

function request(origin: string | null) {
  return new Request("https://app.example.com/api/v1/users/self/api-keys", {
    method: "POST",
    headers: origin ? { origin } : {},
  });
}

describe("isTrustedOrigin", () => {
  test("accepts the request's own origin", () => {
    expect(isTrustedOrigin(request("https://app.example.com"))).toBe(true);
  });

  test("rejects a foreign origin, a missing origin and the null origin", () => {
    expect(isTrustedOrigin(request("https://evil.example.net"))).toBe(false);
    expect(isTrustedOrigin(request(null))).toBe(false);
    expect(isTrustedOrigin(request("null"))).toBe(false);
  });

  test("rejects a different port or scheme on the same host", () => {
    expect(isTrustedOrigin(request("http://app.example.com"))).toBe(false);
    expect(isTrustedOrigin(request("https://app.example.com:8443"))).toBe(false);
  });

  test("accepts an explicitly allowed public origin", () => {
    expect(isTrustedOrigin(request("https://box.example.org"), ["https://box.example.org"])).toBe(
      true,
    );
  });
});

describe("parseAllowedOrigins", () => {
  test("splits, trims and drops empty entries", () => {
    expect(parseAllowedOrigins(" https://a.example , ,https://b.example ")).toEqual([
      "https://a.example",
      "https://b.example",
    ]);
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });
});
