import sinon from "sinon";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
} from "vitest";
import { schema, transaction, Typesaurus } from "..";
import { firestoreSymbol } from "../adapter/admin/firebase.mjs";

describe("transaction", () => {
  interface Counter {
    count: number;
    optional?: true;
  }

  interface Post {
    counter: Typesaurus.Ref<Counter, "counters">;
  }

  const db = schema(($) => ({
    counters: $.collection<Counter>(),
    posts: $.collection<Post>().sub({
      counters: $.collection<Counter>(),
    }),
  }));

  let warn: typeof console.warn;
  beforeAll(() => {
    warn = console.warn;
  });

  beforeEach(() => {
    // typeof jest !== "undefined" && jest.setTimeout(20000);
    console.warn = sinon.spy();
  });

  afterAll(() => {
    console.warn = warn;
  });

  const plusOne = async (
    counter: Typesaurus.Ref<Counter, "counters">,
    useUpdate?: boolean,
  ) =>
    transaction(db)
      .read(($) => $.db.counters.get(counter.id))
      .write(($) => {
        const newCount = ($.result?.data.count || 0) + 1;
        const payload = { count: newCount };
        if (useUpdate) {
          $.result?.update(payload);
        } else {
          $.result?.set(payload);
        }
        return newCount;
      });

  it("performs transaction", async () => {
    const id = await db.counters.id();
    const counter = db.counters.ref(id);
    await counter.set({ count: 0 });
    await Promise.all([plusOne(counter), plusOne(counter), plusOne(counter)]);
    const doc = await counter.get();
    expect(doc?.data.count).toBe(3);
  });

  it("returns the value from the write function", async () => {
    const id = await db.counters.id();
    const counter = db.counters.ref(id);
    await counter.set({ count: 0 });
    const results = await Promise.all([
      plusOne(counter),
      plusOne(counter),
      plusOne(counter),
    ]);
    expect(results.sort()).toEqual([1, 2, 3]);
  });

  it("allows to assert environment", async () => {
    const id = await db.counters.id();

    const server = () =>
      transaction(db, { as: "server" })
        .read(($) => $.db.counters.get(id))
        .write(
          ($) => $.result?.set({ count: ($.result?.data.count || 0) + 1 }),
        );

    const client = () =>
      transaction(db, { as: "client" })
        .read(($) => $.db.counters.get(id))
        .write(
          ($) => $.result?.set({ count: ($.result?.data.count || 0) + 1 }),
        );

    if (typeof window === "undefined") {
      await server();
      expect(client).toThrowError("Expected client environment");
    } else {
      await client();
      expect(server).toThrowError("Expected server environment");
    }
  });

  it("expands references", async () => {
    const counterRef = await db.counters.add({ count: 42 });
    const postRef = await db.posts.add({ counter: counterRef });

    return transaction(db)
      .read(($) => $.db.posts.get(postRef.id))
      .write(($) => {
        expect($.result?.data.counter.type).toBe("ref");
        expect($.result?.data.counter.collection.type).toBe("collection");
        expect($.result?.data.counter.collection.path).toBe("counters");
        expect($.result?.data.counter.collection.get).toBe(undefined);
      });
  });

  it("converts write docs", async () => {
    const id = await db.counters.id();
    const counter = db.counters.ref(id);
    await counter.set({ count: 0 });

    const result = await transaction(db)
      .read(($) => $.db.counters.get(counter.id))
      .write(($) => {
        $.db.counters.set(id, { count: ($.result?.data.count || 0) + 1 });
        return $.result;
      });

    const doc = await result?.get();
    expect(doc?.data.count).toBe(1);
  });

  describe("set", () => {
    it("allows setting", async () => {
      const id = await db.counters.id();
      const counter = db.counters.ref(id);
      await counter.set({ count: 0 });

      await transaction(db)
        .read(($) => $.db.counters.get(counter.id))
        .write(($) =>
          $.db.counters.set(id, { count: ($.result?.data.count || 0) + 1 }),
        );

      const doc = await counter.get();
      expect(doc?.data.count).toBe(1);
    });

    it("works on docs", async () => {
      const id = await db.counters.id();
      const counter = db.counters.ref(id);
      await counter.set({ count: 0 });

      await transaction(db)
        .read(($) => $.db.counters.get(counter.id))
        .write(
          ($) => $.result?.set({ count: ($.result?.data.count || 0) + 1 }),
        );

      const doc = await counter.get();
      expect(doc?.data.count).toBe(1);
    });
  });

  describe("upset", () => {
    it("allows upsetting", async () => {
      const id = await db.counters.id();
      const counter = db.counters.ref(id);
      await counter.set({ count: 0, optional: true });

      await transaction(db)
        .read(($) => $.db.counters.get(counter.id))
        .write(($) =>
          $.db.counters.upset(id, { count: ($.result?.data.count || 0) + 1 }),
        );

      const doc = await counter.get();
      expect(doc?.data.count).toBe(1);
      expect(doc?.data.optional).toBe(true);
    });

    it("works on docs", async () => {
      const id = await db.counters.id();
      const counter = db.counters.ref(id);
      await counter.set({ count: 0, optional: true });

      await transaction(db)
        .read(($) => $.db.counters.get(counter.id))
        .write(
          ($) => $.result?.upset({ count: ($.result?.data.count || 0) + 1 }),
        );

      const doc = await counter.get();
      expect(doc?.data.count).toBe(1);
      expect(doc?.data.optional).toBe(true);
    });
  });

  describe("update", () => {
    it("allows updating", async () => {
      const id = await db.counters.id();
      const counter = db.counters.ref(id);
      await counter.set({ count: 0 });

      await Promise.all([
        plusOne(counter, true),

        transaction(db)
          .read(($) => $.db.counters.get(counter.id))
          .write(($) =>
            $.db.counters.update(id, {
              count: ($.result?.data.count || 0) + 1,
              optional: true,
            }),
          ),
      ]);

      const doc = await counter.get();
      expect(doc?.data.count).toBe(2);
      expect(doc?.data.optional).toBe(true);
    });

    it("works on docs", async () => {
      const id = await db.counters.id();
      const counter = db.counters.ref(id);
      await counter.set({ count: 0 });

      await Promise.all([
        plusOne(counter, true),

        transaction(db)
          .read(($) => $.db.counters.get(counter.id))
          .write(
            ($) =>
              $.result?.update({
                count: ($.result?.data.count || 0) + 1,
                optional: true,
              }),
          ),
      ]);

      const doc = await counter.get();
      expect(doc?.data.count).toBe(2);
      expect(doc?.data.optional).toBe(true);
    });

    it("allows to update via array of fields", async () => {
      const id = await db.counters.id();
      const counter = db.counters.ref(id);
      await counter.set({ count: 0 });

      await Promise.all([
        plusOne(counter, true),

        transaction(db)
          .read(($) => $.db.counters.get(counter.id))
          .write(($) => {
            const { result } = $;
            result?.update(($) => [
              $.field("count").set((result.data.count || 0) + 1),
              $.field("optional").set(true),
            ]);
          }),
      ]);

      const doc = await counter.get();
      expect(doc?.data.count).toBe(2);
      expect(doc?.data.optional).toBe(true);
    });

    it("filters out the empty fields properly", async () => {
      const id = await db.counters.id();
      const counter = db.counters.ref(id);
      await counter.set({ count: 0 });

      await Promise.all([
        plusOne(counter, true),

        transaction(db)
          .read(($) => $.db.counters.get(counter.id))
          .write(($) => {
            // TODO: Make $.result readonly so there's no need to assign a variable?
            const { result } = $;
            return result?.update(($) => [
              false,
              undefined,
              null,
              0,
              $.field("count").set((result.data.count || 0) + 1),
              $.field("optional").set(true),
            ]);
          }),
      ]);

      const doc = await counter.get();
      expect(doc?.data.count).toBe(2);
      expect(doc?.data.optional).toBe(true);
    });

    it("skips empty updates", async () => {
      const id = await db.counters.id();
      const counter = db.counters.ref(id);
      await counter.set({ count: 0 });

      await Promise.all([
        plusOne(counter, true),

        transaction(db)
          .read(($) => $.db.counters.get(counter.id))
          .write(($) => undefined),

        transaction(db)
          .read(($) => $.db.counters.get(counter.id))
          .write(($) => null),

        transaction(db)
          .read(($) => $.db.counters.get(counter.id))
          .write(($) => 0),

        transaction(db)
          .read(($) => $.db.counters.get(counter.id))
          .write(($) => false),

        transaction(db)
          .read(($) => $.db.counters.get(counter.id))
          .write(($) => [undefined, null, 0, false]),
      ]);

      const doc = await counter.get();
      expect(doc?.data.count).toBe(1);
      expect(doc?.data.optional).toBe(undefined);
    });
  });

  describe("remove", () => {
    it("allows removing", async () => {
      const id = await db.counters.id();
      const counter = db.counters.ref(id);
      await counter.set({ count: 0 });

      await transaction(db)
        .read(($) => $.db.counters.get(counter.id))
        .write(($) => $.db.counters.remove(id));

      const doc = await counter.get();
      expect(doc).toBe(null);
    });

    it("works on docs", async () => {
      const id = await db.counters.id();
      const counter = db.counters.ref(id);
      await counter.set({ count: 0 });

      await transaction(db)
        .read(($) => $.db.counters.get(counter.id))
        .write(($) => $.result?.remove());

      const doc = await counter.get();
      expect(doc).toBe(null);
    });
  });

  describe("subcollection", () => {
    it("works on subcollections", async () => {
      const postId = await db.posts.id();
      const counterId = await db.posts.sub.counters.id();

      const plus = async () =>
        transaction(db)
          .read(($) => $.db.posts(postId).counters.get(counterId))
          .write(($) =>
            $.db.posts(postId).counters.set(counterId, {
              count: ($.result?.data.count || 0) + 1,
            }),
          );

      await Promise.all([plus(), plus(), plus()]);

      const doc = await db
        .posts(postId)
        .counters.get(db.posts.sub.counters.id(counterId.toString()));

      expect(doc?.data.count).toBe(3);
    });
  });

  // The firebase-admin SDK supports Transaction.get(query); the firebase-js
  // SDK does not. The web adapter therefore exposes the same method but
  // throws — these tests only run server-side.
  const describeAdmin =
    typeof window === "undefined" ? describe : describe.skip;
  describeAdmin("query (admin only)", () => {
    interface Tag {
      tag: string;
      count: number;
    }

    const tagsDB = schema(($) => ({
      tags: $.collection<Tag>(),
    }));

    it("reads documents matching a where filter", async () => {
      const namespace = `q-${Date.now()}-${Math.random()}`;
      await Promise.all([
        tagsDB.tags.add({ tag: `${namespace}:a`, count: 1 }),
        tagsDB.tags.add({ tag: `${namespace}:b`, count: 5 }),
        tagsDB.tags.add({ tag: `${namespace}:c`, count: 10 }),
      ]);

      const result = await transaction(tagsDB)
        .read(($) =>
          $.db.tags.query(($) => [
            $.field("tag").gte(`${namespace}:`),
            $.field("tag").lt(`${namespace};`),
            $.field("count").gte(5),
          ]),
        )
        .write(($) => $.result?.map((doc) => doc.data.tag).sort());

      expect(result).toEqual([`${namespace}:b`, `${namespace}:c`]);
    });

    it("can write based on a transactional query", async () => {
      const namespace = `qw-${Date.now()}-${Math.random()}`;
      const refs = await Promise.all([
        tagsDB.tags.add({ tag: `${namespace}:x`, count: 1 }),
        tagsDB.tags.add({ tag: `${namespace}:y`, count: 1 }),
      ]);

      await transaction(tagsDB)
        .read(($) =>
          $.db.tags.query(($) => [
            $.field("tag").gte(`${namespace}:`),
            $.field("tag").lt(`${namespace};`),
          ]),
        )
        .write(($) => {
          $.result?.forEach((doc) =>
            doc.update({ count: doc.data.count + 100 }),
          );
        });

      const after = await Promise.all(refs.map((r) => r.get()));
      expect(after.map((d) => d?.data.count).sort()).toEqual([101, 101]);
    });

    it("supports falsy queries to defer execution", async () => {
      const result = await transaction(tagsDB)
        .read(($) => $.db.tags.query(() => undefined))
        .write(($) => $.result);
      expect(result).toBe(undefined);
    });

    it("returns an empty array when no documents match", async () => {
      const namespace = `qe-${Date.now()}-${Math.random()}`;
      const result = await transaction(tagsDB)
        .read(($) =>
          $.db.tags.query(($) => $.field("tag").eq(`${namespace}:nonexistent`)),
        )
        .write(($) => $.result);

      expect(result).toEqual([]);
    });
  });

  describe.skipIf(typeof window !== "undefined" || process.env.BROWSER)(
    "readOnly (admin-only)",
    () => {
      it("resolves with the read result directly, skipping .write", async () => {
        const id = await db.counters.id();
        const counter = db.counters.ref(id);
        await counter.set({ count: 7 });

        const result = await transaction(db, { readOnly: true }).read(($) =>
          $.db.counters.get(counter.id),
        );

        expect(result?.data.count).toBe(7);
      });
    },
  );

  describe.skipIf(typeof window !== "undefined" || process.env.BROWSER)(
    "admin SDK options forwarding",
    () => {
      let stub: sinon.SinonStub;
      let captured: unknown;

      beforeEach(() => {
        captured = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firestore = (db as any)[firestoreSymbol]();
        stub = sinon
          .stub(firestore, "runTransaction")
          .callsFake((_cb: unknown, opts: unknown) => {
            captured = opts;
            return Promise.resolve(undefined);
          });
      });

      afterEach(() => {
        stub.restore();
      });

      it("forwards maxAttempts to runTransaction", async () => {
        await transaction(db, { maxAttempts: 3 })
          .read(() => Promise.resolve(null))
          .write(() => undefined);
        expect(captured).toMatchObject({ maxAttempts: 3 });
      });

      it("forwards readOnly to runTransaction", async () => {
        await transaction(db, { readOnly: true }).read(() =>
          Promise.resolve(null),
        );
        expect(captured).toMatchObject({ readOnly: true });
      });

      it("forwards readTime alongside readOnly (Date → Timestamp)", async () => {
        const readTime = new Date(2026, 0, 1);
        await transaction(db, { readOnly: true, readTime }).read(() =>
          Promise.resolve(null),
        );
        const opts = captured as {
          readOnly: boolean;
          readTime: { toDate(): Date };
        };
        expect(opts.readOnly).toBe(true);
        expect(opts.readTime.toDate().getTime()).toBe(readTime.getTime());
      });
    },
  );

  describe.skipIf(typeof window !== "undefined" || process.env.BROWSER)(
    "admin readTime forwarding (PITR)",
    () => {
      it("ref.get forwards readTime to firestore.getAll", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firestore = (db as any)[firestoreSymbol]();
        const readTime = new Date(2026, 0, 1);
        let capturedArgs: unknown[] | null = null;
        const stub = sinon
          .stub(firestore, "getAll")
          .callsFake((...args: unknown[]) => {
            capturedArgs = args;
            return Promise.resolve([{ exists: false, data: () => null }]);
          });

        try {
          await db.counters.get(db.counters.id("does-not-matter"), {
            readTime,
          });
        } finally {
          stub.restore();
        }

        // getAll(...refs, readOptions): the last argument is the options bag,
        // and Date should be converted to admin's Timestamp.
        expect(capturedArgs).not.toBeNull();
        const last = capturedArgs![capturedArgs!.length - 1] as {
          readTime: { toDate(): Date };
        };
        expect(last.readTime.toDate().getTime()).toBe(readTime.getTime());
      });

      it("query.get wraps in a read-only transaction when readTime is set", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firestore = (db as any)[firestoreSymbol]();
        const readTime = new Date(2026, 0, 1);
        let capturedOpts: unknown = null;
        const stub = sinon
          .stub(firestore, "runTransaction")
          .callsFake((_cb: unknown, opts: unknown) => {
            capturedOpts = opts;
            return Promise.resolve([]);
          });

        try {
          await db.counters.query(($) => $.field("count").eq(0), {
            readTime,
          });
        } finally {
          stub.restore();
        }

        const opts = capturedOpts as {
          readOnly: boolean;
          readTime: { toDate(): Date };
        };
        expect(opts.readOnly).toBe(true);
        expect(opts.readTime.toDate().getTime()).toBe(readTime.getTime());
      });

      it("collection.many forwards readTime to firestore.getAll", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firestore = (db as any)[firestoreSymbol]();
        const readTime = new Date(2026, 0, 1);
        let capturedArgs: unknown[] | null = null;
        const stub = sinon
          .stub(firestore, "getAll")
          .callsFake((...args: unknown[]) => {
            capturedArgs = args;
            return Promise.resolve([
              { exists: false, data: () => null },
              { exists: false, data: () => null },
            ]);
          });

        try {
          await db.counters.many(
            [db.counters.id("a"), db.counters.id("b")],
            { readTime },
          );
        } finally {
          stub.restore();
        }

        expect(capturedArgs).not.toBeNull();
        // Two refs + options bag at the end.
        expect(capturedArgs!.length).toBe(3);
        const last = capturedArgs![capturedArgs!.length - 1] as {
          readTime: { toDate(): Date };
        };
        expect(last.readTime.toDate().getTime()).toBe(readTime.getTime());
      });
    },
  );
});
