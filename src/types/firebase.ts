export namespace TypesaurusFirebase {
  export interface Snapshot {
    id: string;
    data(): any;
  }

  /**
   * Structural shape of `firebase-admin/firestore` `Timestamp`. Used in
   * options that pass through to the SDK so consumers can supply a `Date` or
   * a SDK-native `Timestamp` without us taking a runtime dependency.
   */
  export interface Timestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
  }
}
