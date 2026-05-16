// Type declarations for the runtime `.mjs` module. These mirror the exports
// from `firebase.mjs` so internal call sites (notably tests that stub the
// firestore at the SDK boundary) compile under NodeNext resolution.

export const firestoreSymbol: unique symbol;

export function firestore(options?: {
  app?: string;
  databaseId?: string;
  server?: { app?: string; preferRest?: boolean };
}): unknown;
