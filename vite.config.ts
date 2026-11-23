import { defineConfig } from "vite-plus";

export default defineConfig({
  defaultPackage: "./apps/web",
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: [
      "**/routeTree.gen.ts",
      "**/src/api/generated/**",
      "apps/backend/src/generated/**",
      ".agents/**",
      ".claude/**",
      ".moon/cache/**",
    ],
  },
  lint: {
    ignorePatterns: [
      "**/src/api/generated/**",
      "apps/backend/src/generated/**",
      ".agents/**",
      ".claude/**",
      ".moon/cache/**",
    ],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
});
