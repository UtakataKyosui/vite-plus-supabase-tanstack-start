import { createFileRoute } from "@tanstack/react-router";
import { revokeApiKey } from "backend";
import { apiKeyStore } from "../../../../../../server/api-key-store";
import { withAuth } from "../../../../../../server/auth";

export const Route = createFileRoute("/api/v1/users/self/api-keys/$id")({
  server: {
    handlers: {
      DELETE: withAuth<{ request: Request; params: { id: string } }>(
        ["session"],
        async ({ params, principal }) => {
          await revokeApiKey(apiKeyStore, principal.userId, params.id);
          return new Response(null, { status: 204 });
        },
      ),
    },
  },
});
