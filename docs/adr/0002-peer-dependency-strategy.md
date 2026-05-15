# Peer dependency strategy and supported SDK ranges

**Status:** accepted

Upstream `typesaurus` ships with `firebase` and `firebase-admin` declared
*only* in `devDependencies` — no `peerDependencies`, no enforced range.
The README tells consumers to install Firebase themselves. This produces
no compatibility signal: a consumer on a wildly wrong Firebase major gets
opaque runtime errors instead of a peer-mismatch warning at install time.

## Decision

- **Declare both Firebase packages as optional peers.** `firebase` and
  `firebase-admin` go in `peerDependencies` with
  `peerDependenciesMeta.{...}.optional: true`. Web and admin adapters are
  mutually exclusive in practice; both being required would force every
  consumer to install both.
- **Supported peer ranges on `v11.0.0`:**
  - `firebase >=10.13 <13`
  - `firebase-admin >=12.7 <14`
  The floor on each is whichever minor first shipped vector search
  (`firebase@10.13`, `firebase-admin@12.7`) — without it we'd be calling
  APIs that don't exist on the low end of the range.
- **Compliance policy: drop EOL majors from the peer range actively.**
  When Google EOLs a Firebase major, the next `@doshi/typesaurus` minor
  raises the peer floor past it. This is an explicit narrowing of the
  range over time; consumers on stale Firebase get a peer warning and an
  upgrade path, not silent breakage.
- **Test matrix: 5 jobs, emulator-only on CI.**
  - Web adapter × firebase: `{10.13.0, 11-latest, 12-latest}` — 3 jobs.
  - Admin adapter × firebase-admin: `{12.7.0, 13-latest}` — 2 jobs.
  - Floor + latest of each supported major. No matrix on minors.
  - PITR has an acknowledged gap: the Firestore emulator does not
    support point-in-time recovery. PITR is unit-tested at the SDK
    boundary (we verify we pass the right options); a real-Firestore
    nightly job is a future evolution, not a v1 requirement.
- **Dev-toolchain bumps bundled into v11 (everything else deferred):**
  - `firebase`, `firebase-admin`, `firebase-tools` → current
  - `typescript@^6` (matches the consuming Doshi server pin)
  - `@types/node@^25` (matches the consuming Doshi server pin)
  - `vitest@^3` (1.x is moving into unsupported territory)
  - Babel / Prettier / Sinon / Playwright / size-limit are *not* bumped
    in v11 — they either work or they don't, and a refresh is a separate
    PR with no API-correctness implications.

## Why this is a major-version bump

Adding required `peerDependencies` slots (even optional ones) changes
install behavior — pnpm with strict peer dependency checking will fail
installs on mismatched ranges. Raising the peer floor from upstream's
`firebase ^10.8.0` to `>=10.13` narrows the supported range; under the
conventions used by React, Next.js, Apollo, and Tailwind, peer narrowing
is a major bump. Both of these together are the only breaking changes
in `v11.0.0`; the public source API is unchanged from upstream `10.7.0`.

## Considered alternatives

- *Keep upstream's stance (no `peerDependencies`)* — rejected. The whole
  point of forking is to be the maintained version; declaring peers is
  table stakes for a 2026-era library.
- *Split into `@doshi/typesaurus-web` and `@doshi/typesaurus-admin`* —
  rejected for v1. Cleaner long-term contract, but inflicts a package
  split on fork-day-one consumers. Defer to a possible v12 redesign.
- *Match upstream peer floor literally (`firebase ^10.8.0`)* — rejected.
  Forces runtime feature detection for vector search and breaks the
  type-safe story. The narrowed floor (`>=10.13`) is drop-in for >95%
  of real consumers anyway, since `^10.8.0` auto-patches to 10.13+.
- *Latest major only (`firebase >=12`)* — rejected. Breaks drop-in
  migration for consumers still on firebase 10/11. Reserve narrow-floor
  policy for v12.

## Consequences

- **CI runtime grows by ~5×** vs upstream's single-config setup. Mitigated
  by parallel jobs on GitHub Actions.
- **Renovate / Dependabot config required** so the fork tracks new Firebase
  majors and minors automatically. Configuration lands alongside the
  first publishable RC.
- **Doshi server's existing `firebase-admin@^13.1.0` pin is now inside the
  declared range** for the first time since upstream `10.7.0` shipped.
