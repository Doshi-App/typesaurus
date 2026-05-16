import { getApp } from "firebase-admin/app";
import { getFirestore, initializeFirestore } from "firebase-admin/firestore";

export const firestoreSymbol = Symbol();

export function firestore(options) {
  const appName = options?.server?.app || options?.app;
  const app = getApp(appName);
  const databaseId = options?.databaseId;
  const preferRest = options?.server?.preferRest;

  // `initializeFirestore` is the only entry point that accepts settings;
  // route through it whenever `preferRest` is requested. `databaseId` may
  // be undefined — the admin SDK treats that as `(default)`.
  if (preferRest) {
    return initializeFirestore(app, { preferRest }, databaseId);
  }
  return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}
