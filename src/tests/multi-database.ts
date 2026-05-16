import { describe, expect, it } from "vitest";
import { schema } from "..";

// The Firestore emulator advertises that it "does not support multiple
// databases yet," but the admin SDK targets the named database via a URL
// path that includes the databaseId, and the emulator keys documents on
// the full path. So writes to `(default)` and to a named database are
// isolated by path in practice. The test below pins that behaviour: it
// regresses immediately if the factory drops databaseId.
//
// CI does not run web/browser tests (see .github/workflows/test.yml —
// the web matrix is deferred per ADR 0002). Web-adapter behaviour is
// covered by tysts (`src/tysts/multi-database.ts`) plus visual review
// of the two-line factory change in `src/adapter/web/firebase.mjs`.

const ALT_DB = "multidb-test";

const describeAdmin =
  typeof window === "undefined" && !process.env.BROWSER
    ? describe
    : describe.skip;

describeAdmin("multi-database support (admin)", () => {
  interface Widget {
    kind: string;
  }

  it("isolates a named database from (default)", async () => {
    const collName = `mdb-iso-${Date.now()}-${Math.random()}`;

    const altDb = schema(
      ($) => ({
        widgets: $.collection<Widget>().name(collName),
      }),
      { databaseId: ALT_DB },
    );
    const defaultDb = schema(($) => ({
      widgets: $.collection<Widget>().name(collName),
    }));

    const id = await altDb.widgets.id();
    await altDb.widgets.set(id, { kind: "rotary" });

    const fromAlt = await altDb.widgets.get(id);
    const fromDefault = await defaultDb.widgets.get(
      id as unknown as Parameters<typeof defaultDb.widgets.get>[0],
    );

    expect(fromAlt?.data).toEqual({ kind: "rotary" });
    expect(fromDefault).toBeNull();
  });
});
