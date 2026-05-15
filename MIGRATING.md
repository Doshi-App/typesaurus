# Migrating from `typesaurus` to `@doshi/typesaurus`

`@doshi/typesaurus` is a maintained fork of [`typesaurus`](https://github.com/kossnocorp/typesaurus) (see [`NOTICE.md`](./NOTICE.md) for attribution).

The migration from upstream `typesaurus@10.7.0` is intentionally minimal — see [ADR 0001 § Binding constraints](./docs/adr/0001-fork-rationale-and-v1-scope.md).

## 1. Install

```sh
pnpm add @doshi/typesaurus@next firebase firebase-admin
```

(use the `@next` dist-tag during the RC cycle; drop the suffix once `11.0.0` is promoted to `latest`)

## 2. Update your imports

Every `'typesaurus'` import string becomes `'@doshi/typesaurus'`. Adapter sub-paths transform identically:

```diff
- import { schema } from 'typesaurus';
+ import { schema } from '@doshi/typesaurus';

- import { transaction } from 'typesaurus/transaction';
+ import { transaction } from '@doshi/typesaurus/transaction';
```

If your project pinned upstream typesaurus across many files, a single search-and-replace suffices:

```sh
grep -rl "'typesaurus" src | xargs sed -i '' "s/'typesaurus/'@doshi\/typesaurus/g"
```

## 3. Check your Firebase peer versions

`@doshi/typesaurus@11` declares its supported Firebase SDK ranges as `peerDependencies`. Upstream did not. If your project is below the floor, bump:

| Peer            | Supported range          | Minimum required |
| --------------- | ------------------------ | ---------------- |
| `firebase`      | `>=10.13 <13`            | `10.13.0`        |
| `firebase-admin`| `>=12.7 <14`             | `12.7.0`         |

The floors are set at the first minor that shipped the Firestore vector-search APIs. The ceiling excludes the next un-tested major. See [ADR 0002](./docs/adr/0002-peer-dependency-strategy.md) for the reasoning.

## 4. No source code changes

The public API of `@doshi/typesaurus@11.0.0` is byte-for-byte identical to upstream `typesaurus@10.7.0`. No method signatures, schema-DSL shapes, generic constraints, or return types have changed. If something else breaks, [file an issue](https://github.com/Doshi-App/typesaurus/issues) — it's a fork regression, not intended behavior.

## Known compatibility notes

- **`firebase-tools >= 15`** requires Java 21+ to run the Firestore emulator. If you run integration tests with the emulator, install OpenJDK 21 (Temurin recommended).
- **Firestore lifted the "inequality on multiple properties" restriction** in late 2024. If you have tests asserting that such queries throw, they will hang waiting for an error that no longer fires. (Upstream's own `query.ts` test for this has been marked `it.skip` in the fork — see `src/tests/query.ts`.)
