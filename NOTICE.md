# NOTICE

`@doshi/typesaurus` is a fork of [`typesaurus`](https://github.com/kossnocorp/typesaurus)
by **Sasha Koss** (<koss@nocorp.me>), distributed under the MIT License.

The upstream project's `package.json` declares the MIT License but does not ship a
`LICENSE` file. To discharge the MIT license's "include the license text" obligation
cleanly, this fork adds [`LICENSE`](./LICENSE) preserving Sasha Koss's original
copyright alongside Doshi's copyright for derivative changes.

## Why a fork?

Upstream `typesaurus` (last release `10.7.0`, 2024-06-30) has not received updates
that keep pace with the most recent Firebase JS SDK and Firebase Admin SDK
releases. Doshi depends on Typesaurus in production and is maintaining this fork
to track current Firebase features, ship bug fixes, and accept community PRs.

## Relationship to upstream

- All commits prior to the fork point are authored by upstream contributors and
  retain their original git authorship.
- We will continue to credit Sasha Koss as the original author in
  `package.json#contributors`.
- If upstream becomes active again, we intend to upstream non-Doshi-specific
  improvements rather than diverge permanently.

## Trademark / naming

"Typesaurus" is the upstream project's name. This fork is published under the
`@doshi` npm scope to make its provenance explicit. We do not claim the
unscoped `typesaurus` name on npm.
