# Fork rationale and v1 scope

**Status:** accepted

Upstream `typesaurus` has not shipped a release since `10.7.0` (2024-04-23).
Doshi's server depends on it but already runs against `firebase-admin@^13`,
outside upstream's declared `^12.0.0` compat range. Rather than continue
on unsupported peer ground, we fork as `@doshi/typesaurus` and commit to
maintaining it against current Firebase SDKs.

## Decision

- **Goalpost: compat bump + expose new SDK features.** A pure compat bump
  doesn't justify a fork. We will additively surface Firestore features that
  shipped after upstream `10.7.0`.
- **First stable release is `v11.0.0`.** The breaking changes that earn the
  major are *not* in the source API — they're in the install contract
  (see ADR 0002). v10.x semver would smuggle those changes into a minor and
  implicitly claim "this is what upstream's v10.8 would have been," which we
  consider a presumptuous framing of Sasha Koss's design intent.
- **First published artifact is `11.0.0-rc.0`.** Bytewise equivalent to
  upstream `10.7.0` plus the peer-dep changes from ADR 0002. No new
  features. This validates the publish pipeline before we're also
  validating new code, and gives drop-in migrators an immediate target on
  the `next` dist-tag.
- **V1 feature set (additive only):**
  1. Vector search (`VectorValue`, `findNearest`)
  2. Point-in-time recovery (read-at-timestamp option on gets/queries)
  3. Multi-database support (named databases beyond `(default)`)
  4. **Transaction queries** — passing `where`-filtered queries to
     `transaction.get()`. Available in the admin SDK since v11; never
     exposed by upstream typesaurus. Most-felt gap in Doshi's own usage.
- **No source-level API tightenings in v11.** The library is already
  well-typed (zero `as any`, zero `@ts-ignore` in `src/`). Using the major
  bump as an excuse to redesign things would expand v1's risk surface for
  no clear win. Future tightenings land in v12+.
- **Dogfooding plan: Doshi server flips imports after `rc.0` ships,**
  then tracks the `next` dist-tag through the RC cycle. `11.0.0` is
  promoted to `latest` when (i) the RCs have run in Doshi prod for at
  least one sprint without typesaurus-attributed incidents, and (ii) at
  least one external consumer has tried an RC.

## Binding constraints

- **Drop-in migration from upstream `typesaurus@10.7.0`.** The migration
  must be approximately a `sed -i 's/typesaurus/@doshi\/typesaurus/g'` —
  no breaking API changes in v11.
- **Compliance posture.** Track latest Firebase SDK majors closely.
  Drop EOL majors from the peer range when Google ends support (see
  ADR 0002 for the range mechanics).

## Considered alternatives

- *Vendoring upstream into Doshi's monorepo* — rejected. Couples Doshi's
  release cadence to firebase bumps and helps no other consumer.
- *Pure compat bump (no new features)* — rejected. Insufficient
  differentiation to justify a fork; drives no value beyond what a PR to
  upstream would (if upstream merged it).
- *Reset version to `1.0.0` under `@doshi`* — rejected. Erases the
  visible link to upstream's version history and weakens the drop-in
  migration story.
- *Permanent prerelease tag (`10.7.0-doshi.N`)* — rejected. Signals
  "experimental forever," which contradicts the fork-as-maintained-
  replacement positioning.

## Consequences

- **`MIGRATING.md` is table stakes for v11** — must document the install
  change, the peer floor change (ADR 0002), and any small behavioral
  differences observed during the RC cycle.
- **Vector search and PITR have a test-coverage gap** — the Firestore
  emulator does not currently support PITR; mocked at the SDK boundary
  in CI (see ADR 0002 § Test matrix).
- **We owe upstream a courtesy issue** announcing the fork and offering
  to upstream non-Doshi-specific changes. Tracked separately from this
  ADR.
