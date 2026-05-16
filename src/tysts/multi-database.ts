import { schema } from "..";

interface Widget {
  kind: string;
}

// Multi-database support: `Options.databaseId` lives at the top level of
// the options bag, alongside `app`. Adapter-scoped namespaces remain for
// adapter-specific knobs (`server.preferRest`, `client.app`).

// Accepted: omitted entirely (targets `(default)`).
schema(($) => ({
  widgets: $.collection<Widget>(),
}));

// Accepted: `databaseId` on its own.
schema(
  ($) => ({
    widgets: $.collection<Widget>(),
  }),
  { databaseId: "alt-db" },
);

// Accepted: `databaseId` alongside `server.preferRest`.
schema(
  ($) => ({
    widgets: $.collection<Widget>(),
  }),
  { databaseId: "alt-db", server: { preferRest: true } },
);

// Accepted: `databaseId` alongside `client.app` (web-side override).
schema(
  ($) => ({
    widgets: $.collection<Widget>(),
  }),
  { databaseId: "alt-db", client: { app: "secondary" } },
);

// Accepted: full combo.
schema(
  ($) => ({
    widgets: $.collection<Widget>(),
  }),
  {
    app: "primary",
    databaseId: "alt-db",
    server: { app: "server-primary", preferRest: true },
    client: { app: "client-primary" },
  },
);

// @ts-expect-error - databaseId must be a string when provided.
schema(($) => ({ widgets: $.collection<Widget>() }), { databaseId: 42 });

// @ts-expect-error - unknown top-level options are rejected.
schema(($) => ({ widgets: $.collection<Widget>() }), { databaseID: "alt" });
