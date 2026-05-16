import sinon from "sinon";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { listCollections, schema } from "..";
import { firestoreSymbol } from "../adapter/admin/firebase.mjs";

// All four passthroughs are admin-only and depend on the firebase-admin SDK.
// Skip the entire suite in the browser environment — the web adapter raises
// at runtime, which is exercised in dedicated web-only tests below.
const describeAdmin =
  typeof window === "undefined" && !process.env.BROWSER
    ? describe
    : describe.skip;

describeAdmin("admin-only passthroughs", () => {
  interface User {
    name: string;
  }

  interface Order {
    sku: string;
  }

  const db = schema(($) => ({
    users: $.collection<User>().sub({
      orders: $.collection<Order>(),
    }),
  }));

  describe("ref.create", () => {
    it("writes the document on first call", async () => {
      const id = await db.users.id();
      const ref = db.users.ref(id);
      await ref.create({ name: "Sasha" });
      const got = await ref.get();
      expect(got?.data).toEqual({ name: "Sasha" });
    });

    it("rejects when the document already exists", async () => {
      const id = await db.users.id();
      const ref = db.users.ref(id);
      await ref.create({ name: "Sasha" });
      await expect(ref.create({ name: "Anton" })).rejects.toThrow();
    });
  });

  describe("collection.create", () => {
    it("writes a document at the given id", async () => {
      const id = await db.users.id();
      await db.users.create(id, { name: "Lesha" });
      const got = await db.users.get(id);
      expect(got?.data).toEqual({ name: "Lesha" });
    });
  });

  describe("recursiveDelete", () => {
    it("removes a single document via ref.recursiveDelete", async () => {
      const id = await db.users.id();
      const ref = db.users.ref(id);
      await ref.set({ name: "Marina" });
      await ref.recursiveDelete();
      const got = await ref.get();
      expect(got).toBeNull();
    });

    it("removes subcollections under a document", async () => {
      const userId = await db.users.id();
      await db.users.set(userId, { name: "Olya" });
      const orderId = await db.users.sub.orders.id();
      await db.users(userId).orders.set(orderId, { sku: "SKU-1" });

      await db.users.ref(userId).recursiveDelete();

      const user = await db.users.get(userId);
      const order = await db.users(userId).orders.get(orderId);
      expect(user).toBeNull();
      expect(order).toBeNull();
    });

    it("removes an entire collection via collection.recursiveDelete", async () => {
      const isolatedDb = schema(($) => ({
        widgets: $.collection<{ kind: string }>().name(
          `widgets-${Date.now()}-${Math.random()}`,
        ),
      }));
      const a = await isolatedDb.widgets.id();
      const b = await isolatedDb.widgets.id();
      await isolatedDb.widgets.set(a, { kind: "A" });
      await isolatedDb.widgets.set(b, { kind: "B" });

      await isolatedDb.widgets.recursiveDelete();

      const remaining = await isolatedDb.widgets.all();
      expect(remaining).toEqual([]);
    });
  });

  describe("listCollections", () => {
    it("lists subcollections under a document via ref.listCollections", async () => {
      const userId = await db.users.id();
      await db.users.set(userId, { name: "Pasha" });
      const orderId = await db.users.sub.orders.id();
      await db.users(userId).orders.set(orderId, { sku: "SKU-2" });

      const subs = await db.users.ref(userId).listCollections();
      expect(subs).toContain("orders");
    });

    it("lists top-level collections via listCollections(db)", async () => {
      const isolatedDb = schema(($) => ({
        widgets: $.collection<{ kind: string }>().name(
          `lc-widgets-${Date.now()}-${Math.random()}`,
        ),
      }));
      const id = await isolatedDb.widgets.id();
      await isolatedDb.widgets.set(id, { kind: "A" });

      const top = await listCollections(isolatedDb);
      expect(top).toContain(
        (isolatedDb.widgets as unknown as { path: string }).path,
      );
    });
  });

  describe("query.explain", () => {
    let stub: sinon.SinonStub;
    let captured: unknown;
    const fakeResults = {
      metrics: { planSummary: { indexesUsed: [] } },
      snapshot: undefined,
    };

    beforeEach(() => {
      captured = null;
      const firestoreFactory = (
        db as unknown as Record<symbol, () => unknown>
      )[firestoreSymbol] as () => unknown;
      const firestore = firestoreFactory() as {
        collection(path: string): unknown;
      };
      // Replace Firestore CollectionReference.prototype.explain with a stub
      // so we exercise plumbing without depending on emulator support.
      // We intercept the prototype because the query builder constructs its
      // own CollectionReference instance each call.
      const collectionRef = firestore.collection("users");
      const proto = Object.getPrototypeOf(
        Object.getPrototypeOf(collectionRef),
      ) as { explain?: (opts: unknown) => Promise<unknown> };
      stub = sinon
        .stub(proto, "explain")
        .callsFake((opts: unknown) => {
          captured = opts;
          return Promise.resolve(fakeResults);
        });
    });

    afterEach(() => {
      stub.restore();
    });

    it("forwards options and returns ExplainResults", async () => {
      const results = await db.users
        .query(($) => $.field("name").eq("Sasha"))
        .explain({ analyze: true });
      expect(captured).toMatchObject({ analyze: true });
      expect(results).toEqual(fakeResults);
    });
  });
});

const describeWeb =
  typeof window !== "undefined" || process.env.BROWSER
    ? describe
    : describe.skip;

describeWeb("admin-only passthroughs (web throws)", () => {
  interface User {
    name: string;
  }

  const db = schema(($) => ({
    users: $.collection<User>(),
  }));

  it("ref.create throws", async () => {
    const ref = db.users.ref(db.users.id("u"));
    await expect(ref.create({ name: "x" })).rejects.toThrow(/admin/);
  });

  it("collection.create throws", async () => {
    await expect(
      db.users.create(db.users.id("u"), { name: "x" }),
    ).rejects.toThrow(/admin/);
  });

  it("ref.recursiveDelete throws", async () => {
    const ref = db.users.ref(db.users.id("u"));
    await expect(ref.recursiveDelete()).rejects.toThrow(/admin/);
  });

  it("collection.recursiveDelete throws", async () => {
    await expect(db.users.recursiveDelete()).rejects.toThrow(/admin/);
  });

  it("ref.listCollections throws", async () => {
    const ref = db.users.ref(db.users.id("u"));
    await expect(ref.listCollections()).rejects.toThrow(/admin/);
  });

  it("listCollections(db) throws", async () => {
    await expect(listCollections(db)).rejects.toThrow(/admin/);
  });

  it("query.explain throws", async () => {
    await expect(
      db.users.query(($) => $.field("name").eq("x")).explain(),
    ).rejects.toThrow(/admin/);
  });
});
