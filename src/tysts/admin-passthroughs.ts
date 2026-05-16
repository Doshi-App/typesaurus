import { listCollections, schema, Typesaurus } from "..";

interface User {
  name: string;
}

const db = schema(($) => ({
  users: $.collection<User>(),
}));

async function refCreate() {
  const ref = db.users.ref(db.users.id("u"));

  // Allowed: default and explicit "server" environment.
  await ref.create({ name: "x" });
  await ref.create({ name: "x" }, { as: "server" });

  // @ts-expect-error - admin-only; "client" environment is rejected.
  await ref.create({ name: "x" }, { as: "client" });

  return ref;
}

async function collectionCreate() {
  await db.users.create(db.users.id("u"), { name: "x" });
  await db.users.create(db.users.id("u"), { name: "x" }, { as: "server" });

  // @ts-expect-error - admin-only; "client" environment is rejected.
  await db.users.create(db.users.id("u"), { name: "x" }, { as: "client" });
}

async function recursiveDelete() {
  const ref = db.users.ref(db.users.id("u"));
  await ref.recursiveDelete();
  await ref.recursiveDelete({ as: "server" });
  // @ts-expect-error - admin-only; "client" environment is rejected.
  await ref.recursiveDelete({ as: "client" });

  await db.users.recursiveDelete();
  await db.users.recursiveDelete({ as: "server" });
  // @ts-expect-error - admin-only; "client" environment is rejected.
  await db.users.recursiveDelete({ as: "client" });
}

async function refListCollections() {
  const ref = db.users.ref(db.users.id("u"));
  const ids: string[] = await ref.listCollections();
  await ref.listCollections({ as: "server" });
  // @ts-expect-error - admin-only; "client" environment is rejected.
  await ref.listCollections({ as: "client" });
  return ids;
}

async function topLevelListCollections() {
  const ids: string[] = await listCollections(db);
  await listCollections(db, { as: "server" });
  // @ts-expect-error - admin-only; "client" environment is rejected.
  await listCollections(db, { as: "client" });
  return ids;
}

async function queryExplain() {
  const sp = db.users.query(($) => $.field("name").eq("x"));
  const results = await sp.explain({ analyze: true });
  // ExplainResults metric shape is structurally exposed.
  results.metrics.planSummary.indexesUsed;
  await sp.explain({ analyze: true, as: "server" });
  // @ts-expect-error - admin-only; "client" environment is rejected.
  await sp.explain({ as: "client" });
}

// Silence "is declared but its value is never read" while still keeping the
// type-checks above active.
export const _tystAdminPassthroughs = [
  refCreate,
  collectionCreate,
  recursiveDelete,
  refListCollections,
  topLevelListCollections,
  queryExplain,
] satisfies Array<(...args: unknown[]) => unknown>;

// Touch the namespace so the file's tysts are picked up as a module.
export type _AdminPassthroughsTystSchema = Typesaurus.Schema<typeof db>;
