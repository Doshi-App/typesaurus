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

  /**
   * Options accepted by `query.explain` — mirrors `firebase-admin`'s
   * `ExplainOptions`.
   */
  export interface ExplainOptions {
    analyze?: boolean;
  }

  /**
   * Structural mirror of `firebase-admin/firestore` `PlanSummary`.
   */
  export interface PlanSummary {
    readonly indexesUsed: Array<Record<string, unknown>>;
  }

  /**
   * Structural mirror of `firebase-admin/firestore` `ExecutionStats`.
   */
  export interface ExecutionStats {
    readonly resultsReturned: number;
    readonly executionDuration: { readonly seconds: number; readonly nanoseconds: number };
    readonly readOperations: number;
    readonly debugStats: Record<string, unknown>;
  }

  /**
   * Structural mirror of `firebase-admin/firestore` `ExplainMetrics`.
   */
  export interface ExplainMetrics {
    readonly planSummary: PlanSummary;
    readonly executionStats?: ExecutionStats;
  }

  /**
   * Structural mirror of `firebase-admin/firestore` `ExplainResults`. We
   * intentionally surface the SDK shape verbatim rather than re-typing it
   * against the model — query plans are not model-dependent.
   */
  export interface ExplainResults<Snapshot = unknown> {
    readonly metrics: ExplainMetrics;
    readonly snapshot?: Snapshot;
  }
}
