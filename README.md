> **`@doshi/typesaurus` — a maintained fork of [typesaurus](https://github.com/kossnocorp/typesaurus) by [Sasha Koss](https://github.com/kossnocorp).**
>
> Upstream is unreleased since 2024-06-30. This fork is maintained by [Doshi](https://doshi.app) to keep the library current with the latest Firebase JS SDK and Firebase Admin SDK features. See [NOTICE.md](./NOTICE.md) for attribution, [LICENSE](./LICENSE) for the MIT license, and [CHANGELOG.md](./CHANGELOG.md) for fork-specific changes.
>
> Original maintainer: please reach out at <engineering@doshi.app> — happy to upstream changes.

![](https://raw.githubusercontent.com/kossnocorp/typesaurus/main/promo.gif)

# 🦕 Typesaurus (`@doshi/typesaurus`)

TypeScript-first ODM for Firestore.

_Looking for **React** adaptor?_ Check [Typesaurus React](https://github.com/kossnocorp/typesaurus-react)!

**Why?**

- Designed with TypeScript's type inference in mind
- Universal code (browser & Node.js)
- Uncompromised type-safety
- Code autocomplete
- Say goodbye to any!
- Say goodbye to exceptions!
- [Ready to start? Follow this guide](https://typesaurus.com/get-started/).

## Installation

The fork is published as [`@doshi/typesaurus`](https://www.npmjs.com/package/@doshi/typesaurus):

```sh
pnpm add @doshi/typesaurus firebase firebase-admin
```

_Note that Typesaurus requires the `firebase` package to work in the web environment and `firebase-admin` to work in Node.js. These packages aren't listed as dependencies, so they won't install automatically with the Typesaurus package._

> Migrating from upstream `typesaurus`? Replace the import: `import { schema } from 'typesaurus'` → `import { schema } from '@doshi/typesaurus'`. The public API is unchanged at the fork point.

## Features

- **Complete type-safety**: uncompromised type-safety, includes Firestore quirks.
- **Universal package**: reuse the same code on the client and server.
- **JavaScript-native**: converts Firestore data types, i.e. timestamp, to native JS types, i.e. `Date`.
- **Build size-efficiency**: optimized build-size for web.
- **Typed ids**: all document ids are types, so you'll never mix up a user id with an account id.
- **Centralized schema**: easy to define, read and update.
- **Single-import principle**: single import to define, single import to use.

<!-- TODO: Do it one day
Want to read about features in detail? [Go to Key Features](https://typesaurus.com/about/features/). -->

## Changelog

See [the changelog](./CHANGELOG.md).

## License

[MIT © Sasha Koss](https://kossnocorp.mit-license.org/)
