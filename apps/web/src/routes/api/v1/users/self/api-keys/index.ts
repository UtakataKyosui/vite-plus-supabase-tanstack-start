import { createFileRoute } from "@tanstack/react-router";
import { createApiKey, listApiKeys, parseApiKeyCreate } from "backend";
import { apiKeyStore } from "../../../../../../server/api-key-store";
import { withAuth } from "../../../../../../server/auth";

export const Route = createFileRoute("/api/v1/users/self/api-keys/")({
  server: {
    handlers: {
      GET: withAuth(["session"], async ({ principal }) =>
        Response.json(await listApiKeys(apiKeyStore, principal.userId)),
      ),
      POST: withAuth(["session"], async ({ request, principal }) => {
        const input = parseApiKeyCreate(await request.json().catch(() => undefined));
        return Response.json(await createApiKey(apiKeyStore, principal.userId, input), {
          status: 201,
        });
      }),
    },
  },
});
