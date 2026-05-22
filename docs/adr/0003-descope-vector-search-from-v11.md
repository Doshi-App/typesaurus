# Descope vector search from v11

**Status:** accepted

[ADR 0001](./0001-fork-rationale-and-v1-scope.md) listed vector search
(`VectorValue`, `findNearest`) as the first item in the v11 additive
feature set. While preparing rc.3 we audited the actual SDK surface
against our peer floor and found the feature does not ship cleanly on
both adapters today.

## What we found

- **Admin SDK** (`@google-cloud/firestore@7.x` via `firebase-admin@>=12.7`)
  — `Query.findNearest(VectorQueryOptions)` is stable. `FieldValue.vector(values)`
  is stable. Both have been available since the peer floor.
- **Web SDK** (`@firebase/firestore@4.x` via `firebase@>=10.13`) —
  `vector(values)` / `VectorValue` is stable and exported from the public
  entry point. **`Query.findNearest` is not exported from the public
  entry point.** The only `findNearest` surface in `@firebase/firestore`
  is `Pipeline.findNearest(FindNearestStageOptions)`, part of the
  preview Pipelines API.
- Pipelines is explicitly **deferred to v11.x or later** in
  [CHANGELOG.md](../../CHANGELOG.md) ("Firestore Pipelines wrapper —
  preview API, moving target"). We are not pulling it forward for v11.

## Decision

- **Drop vector search from the v11.0.0 scope.** The "Subsequent RCs —
  additive features" section of the changelog is removed; the feature
  moves under "Deferred to v11.x or later."
- **No rc.3 is required for v11.0.0.** Promote `11.0.0-rc.2` to `latest`
  once the dogfooding conditions in ADR 0001 are met (production sprint
  soak, external consumer try, upstream courtesy issue).
- **Track the feature for v11.1.** Implementation is gated on either
  (a) the web SDK exposing `Query.findNearest` on the stable surface,
  or (b) us shipping the Pipelines wrapper first. We do not commit to
  either path in this ADR — the v11.1 issue holds the live discussion.

## Considered alternatives

- *Admin-only `query.findNearest` (matches the rc.1 pattern of
  transaction queries, `query.explain`, `recursiveDelete`)* — rejected
  **for v11.0.0**. ADR 0001 framed vector search as a headline V1
  feature; shipping it admin-only would contradict that framing and
  would set a precedent that "V1 feature" can mean "one adapter only."
  Not rejected forever — it is the most likely v11.1 path if the web
  SDK does not surface `findNearest` on stable. The v11.1 issue tracks
  the call.
- *Pull the Pipelines wrapper forward into v11.0.0* — rejected. ADR 0001
  capped v11 scope deliberately; Pipelines is a preview API with a
  moving target and is itself worth its own ADR when we pick it up.
- *Hold v11.0.0 until the web SDK exposes stable `findNearest`* —
  rejected. Doshi server is already running RCs in production; the
  rest of the v11 surface is stable and externally useful. Blocking
  promotion on a Google SDK release we don't control is bad timing.

## Consequences

- **`VectorValue` writes still work on both adapters.** Consumers that
  write embeddings (via the underlying `firebase`/`firebase-admin`
  surface) keep doing so. We are simply not adding our own `$.vector(...)`
  write helper or `query.findNearest(...)` read helper in v11.0.0.
- **No partial vector surface ships in v11.0.0.** No half-typed write
  helper without a matching query side, no admin-only escape hatch that
  we later have to migrate consumers off of.
- **Upstream courtesy issue framing.** When we announce the fork on
  `kossnocorp/typesaurus`, the v11 feature list reads "PITR, multi-DB,
  transaction queries, admin passthroughs" — three of the original
  four. The omission of vector search becomes part of the announcement,
  not a footnote.
