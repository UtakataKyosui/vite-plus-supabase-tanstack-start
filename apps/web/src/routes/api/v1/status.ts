import { createFileRoute } from "@tanstack/react-router";
import { getStatus } from "backend";

export const Route = createFileRoute("/api/v1/status")({
  server: {
    handlers: {
      GET: () => Response.json(getStatus()),
    },
  },
});
