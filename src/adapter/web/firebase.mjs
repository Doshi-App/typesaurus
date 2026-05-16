import { getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firestoreSymbol = Symbol();

export function firestore(options) {
  const appName = options?.client?.app || options?.app;
  const app = getApp(appName);
  const databaseId = options?.databaseId;
  return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}
