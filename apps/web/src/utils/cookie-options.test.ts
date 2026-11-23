import { describe, expect, test } from "vite-plus/test";
import { hardenCookieOptions, isSecureRequest } from "./cookie-options";

describe("hardenCookieOptions", () => {
  test("forces HttpOnly, SameSite=Lax and path / while keeping the lifetime", () => {
    const options = hardenCookieOptions(
      { maxAge: 400, httpOnly: false, sameSite: "none", path: "/x", domain: "example.com" },
      true,
    );

    expect(options).toMatchObject({
      maxAge: 400,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      domain: "example.com",
    });
  });

  test("works without options", () => {
    expect(hardenCookieOptions(undefined, false)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
    });
  });
});

describe("isSecureRequest", () => {
  test("detects https directly and behind a proxy", () => {
    expect(isSecureRequest(new Request("https://app.example.com/"))).toBe(true);
    expect(
      isSecureRequest(
        new Request("http://internal/", { headers: { "x-forwarded-proto": "https, http" } }),
      ),
    ).toBe(true);
    expect(isSecureRequest(new Request("http://localhost:3000/"))).toBe(false);
  });
});
