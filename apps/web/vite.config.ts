import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, lazyPlugins } from "vite-plus";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  run: {
    tasks: {
      "check:all": ["vp check", "fallow dead-code --no-cache"],
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
