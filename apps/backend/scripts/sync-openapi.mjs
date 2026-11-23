// Regenerates openapi.yaml from a sysadminsmedia/homebox checkout.
// Usage: vp run sync:openapi <path to homebox checkout>
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const upstream = process.argv[2];
if (!upstream) {
  console.error("usage: sync-openapi.mjs <path to homebox checkout>");
  process.exit(1);
}
const srcPath = path.join(upstream, "backend/app/api/static/docs/openapi-3.json");
const routesPath = path.join(upstream, "backend/app/api/routes.go");
const outPath = new URL("../openapi.yaml", import.meta.url);
const commit = execFileSync("git", ["-C", upstream, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const spec = JSON.parse(fs.readFileSync(srcPath, "utf8"));
const routesSrc = fs.readFileSync(routesPath, "utf8");
const METHODS = ["get", "post", "put", "patch", "delete"];

// ---- parse routes.go: method, path, handler, middleware set
const routeRe =
  /r\.(Get|Post|Put|Patch|Delete)\(\s*"([^"]+)",\s*chain\.ToHandlerFunc\(v1Ctrl\.(\w+)\(/g;
const routes = [];
for (const m of routesSrc.matchAll(routeRe)) {
  const rest = routesSrc.slice(m.index + m[0].length);
  const end = rest.search(/\)\s*,?\s*\)\s*\n/);
  const mw = rest.slice(0, end);
  routes.push({
    method: m[1].toLowerCase(),
    path: `/v1${m[2]}`,
    handler: m[3],
    owner: mw.includes("ownerMW"),
    asset: mw.includes("assetMW"),
    rateLimited: /RateLimit|notifierTestLimiter/.test(mw),
    authed: /userMW|ownerMW|assetMW/.test(mw),
  });
}
// telemetry is registered with an inline func, not a v1Ctrl handler
if (routesSrc.includes('r.Post("/telemetry"')) {
  routes.push({
    method: "post",
    path: "/v1/telemetry",
    handler: "HandleTelemetryProxy",
    authed: true,
  });
}
const routeKey = (m, p) => `${m} ${p}`;
const routeMap = new Map(routes.map((r) => [routeKey(r.method, r.path), r]));

// ---- info / servers
spec.info = {
  title: "Homebox API",
  version: "1.0",
  description: [
    "Track, Manage, and Organize your Things.",
    "",
    `Derived from sysadminsmedia/homebox backend (commit ${commit}).`,
    "Generated from the upstream swag output and corrected against `backend/app/api/routes.go`.",
    "See apps/backend/README.md for the list of corrections.",
  ].join("\n"),
  contact: { name: "Homebox Team", url: "https://discord.homebox.software" },
  license: { name: "AGPL-3.0", url: "https://github.com/sysadminsmedia/homebox/blob/main/LICENSE" },
  "x-upstream": {
    repository: "https://github.com/sysadminsmedia/homebox",
    path: "backend",
    commit,
  },
};
spec.servers = [{ url: "/api", description: "Same origin as the web client" }];

// ---- components
const C = spec.components;
C.securitySchemes = {
  CookieAuth: {
    type: "apiKey",
    in: "cookie",
    name: "hb.auth.token",
    description: "Session token cookie set by /v1/users/login. Checked before any other source.",
  },
  BearerAuth: {
    type: "apiKey",
    in: "header",
    name: "Authorization",
    description: "Session token or API key. The `Bearer ` prefix is optional.",
  },
  AttachmentToken: {
    type: "apiKey",
    in: "query",
    name: "access_token",
    description:
      "Attachment-scoped token (TokenResponse.attachmentToken). Only accepted on routes that allow the attachments role.",
  },
};
C.parameters = {
  TenantHeader: {
    name: "X-Tenant",
    in: "header",
    required: false,
    description: "Collection (group) ID to operate on. Defaults to the user's default collection.",
    schema: { type: "string", format: "uuid" },
  },
  TenantQuery: {
    name: "tenant",
    in: "query",
    required: false,
    description: "Fallback for X-Tenant when headers cannot be set (e.g. <img src>).",
    schema: { type: "string", format: "uuid" },
  },
};
const errorContent = {
  "application/json": { schema: { $ref: "#/components/schemas/validate.ErrorResponse" } },
};
C.responses = {
  Unauthorized: { description: "Missing, invalid or expired token", content: errorContent },
  Forbidden: {
    description: "Authenticated but not allowed (role or collection ownership)",
    content: errorContent,
  },
  TooManyRequests: { description: "Rate limit exceeded", content: errorContent },
};

// ---- path fixes
const paths = spec.paths;
paths["/v1/users/self/change-password"] = paths["/v1/users/change-password"];
delete paths["/v1/users/change-password"];

paths["/v1/labelmaker/entity/{id}"] = {
  get: {
    ...structuredClone(paths["/v1/labelmaker/item/{id}"].get),
    tags: ["Entities"],
    summary: "Get Entity label",
    description: "Alias of /v1/labelmaker/item/{id}.",
  },
};

paths["/v1/ws/events"] = {
  get: {
    tags: ["Base"],
    summary: "Subscribe to collection mutation events",
    description: [
      "WebSocket endpoint (subprotocol `hb-auth`). The token may be sent as the second",
      "element of `Sec-WebSocket-Protocol` (`hb-auth, <token>`) or as a session token in",
      "`?access_token=` (this route is the only one that accepts session tokens via query).",
      "",
      'Server messages are JSON `{ "event": string }`, broadcast to sockets of the same collection.',
      "A `ping` event is sent every 10 seconds.",
    ].join("\n"),
    security: [{ CookieAuth: [] }, { BearerAuth: [] }, { SessionQueryToken: [] }],
    responses: {
      101: { description: "Switching Protocols" },
    },
    "x-websocket": {
      subprotocol: "hb-auth",
      messages: { $ref: "#/components/schemas/ws.EventMessage" },
    },
  },
};
C.securitySchemes.SessionQueryToken = {
  type: "apiKey",
  in: "query",
  name: "access_token",
  description: "Session token via query string. Only accepted on /v1/ws/events.",
};
C.schemas["ws.EventMessage"] = {
  type: "object",
  required: ["event"],
  properties: {
    event: {
      type: "string",
      enum: [
        "ping",
        "tag.mutation",
        "entity.mutation",
        "user.mutation",
        "export.mutation",
        "import.mutation",
        "label_template.mutation",
      ],
    },
  },
};

paths["/v1/telemetry"] = {
  post: {
    tags: ["Base"],
    summary: "OpenTelemetry proxy",
    description: "Forwards OTLP payloads from the web client to the configured collector.",
    "x-homebox-condition": "otel.enabled && otel.proxy_enabled",
    requestBody: {
      required: true,
      content: { "application/x-protobuf": { schema: { type: "string", format: "binary" } } },
    },
    responses: { 200: { description: "Forwarded" } },
  },
};
for (const p of ["/v1/users/login/oidc", "/v1/users/login/oidc/callback"]) {
  paths[p].get["x-homebox-condition"] = "oidc.enabled";
}

// ---- per-operation enrichment
const lowerFirst = (s) => s[0].toLowerCase() + s.slice(1);
const operationIdOverrides = {
  "get /v1/labelmaker/entity/{id}": "getEntityLabel",
};
const usedIds = new Set();
const missingInRoutes = [];

for (const [p, item] of Object.entries(paths)) {
  for (const m of METHODS) {
    const op = item[m];
    if (!op) continue;
    const r = routeMap.get(routeKey(m, p));
    if (!r) {
      missingInRoutes.push(routeKey(m, p));
      continue;
    }
    r.seen = true;

    const id =
      operationIdOverrides[routeKey(m, p)] ?? lowerFirst(r.handler.replace(/^Handle(r)?/, ""));
    if (usedIds.has(id)) throw new Error(`duplicate operationId ${id}`);
    usedIds.add(id);
    op.operationId = id;

    if (r.authed) {
      if (!op.security?.some((s) => "SessionQueryToken" in s)) {
        op.security = [{ CookieAuth: [] }, { BearerAuth: [] }];
        if (r.asset) op.security.push({ AttachmentToken: [] });
      }
      op.parameters = [
        { $ref: "#/components/parameters/TenantHeader" },
        { $ref: "#/components/parameters/TenantQuery" },
        ...(op.parameters ?? []),
      ];
      op.responses["401"] ??= { $ref: "#/components/responses/Unauthorized" };
    } else {
      op.security = [];
    }
    if (r.owner) {
      op.responses["403"] = { $ref: "#/components/responses/Forbidden" };
      op.description = [op.description, "Requires the owner role on the collection."]
        .filter(Boolean)
        .join("\n\n");
    }
    if (r.rateLimited) op.responses["429"] = { $ref: "#/components/responses/TooManyRequests" };
  }
}

const unseen = routes.filter((r) => !r.seen).map((r) => routeKey(r.method, r.path));
if (missingInRoutes.length || unseen.length) {
  console.error("spec-only:", missingInRoutes, "\nroutes-only:", unseen);
  process.exit(1);
}

// OpenAPI 3.0 requires `type` alongside `nullable`; swag emits `allOf: [$ref]` + nullable only.
const fixNullable = (node) => {
  if (!node || typeof node !== "object") return;
  if (node.nullable && !node.type && Array.isArray(node.allOf)) {
    for (const s of node.allOf) {
      const target = s.$ref && C.schemas[s.$ref.split("/").pop()];
      if (target?.type !== "object") throw new Error(`nullable allOf to non-object ${s.$ref}`);
    }
    node.type = "object";
  }
  for (const v of Object.values(node)) fixNullable(v);
};
fixNullable(C.schemas);

spec.paths = Object.fromEntries(Object.entries(paths).sort(([a], [b]) => a.localeCompare(b)));
spec.security = [{ CookieAuth: [] }, { BearerAuth: [] }];

const ordered = {
  openapi: spec.openapi,
  info: spec.info,
  servers: spec.servers,
  security: spec.security,
  paths: spec.paths,
  components: spec.components,
};
fs.writeFileSync(outPath, YAML.stringify(ordered, { lineWidth: 0, aliasDuplicateObjects: false }));
console.log(`routes=${routes.length} ops=${usedIds.size}`);
