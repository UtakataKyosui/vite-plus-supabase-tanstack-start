import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, lazyPlugins } from "vite-plus";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: [".agents/**", ".claude/**"],
  },
  lint: {
    ignorePatterns: [".agents/**", ".claude/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    tasks: {
      "check:all": ["vp check", "biome ci .", "fallow dead-code --no-cache"],
    },
  },
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: lazyPlugins(() => [tailwindcss(), tanstackStart(), viteReact()]),
});
