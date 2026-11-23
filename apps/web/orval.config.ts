import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      target: "../backend/openapi.yaml",
    },
    output: {
      mode: "tags-split",
      target: "src/api/generated/endpoints",
      schemas: "src/api/generated/model",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      override: {
        mutator: { path: "src/api/fetcher.ts", name: "apiFetch" },
        fetch: { includeHttpResponseReturnType: false },
        query: { useQuery: true, useSuspenseQuery: true },
      },
    },
  },
});
