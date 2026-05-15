.DEFAULT_GOAL := build
.PHONY: build

types:
	pnpm exec tsc --build tsconfig.build.json --force

types-watch:
	pnpm exec tsc --build tsconfig.build.json --watch

types-diagnoze:
	pnpm exec tsc --extendedDiagnostics

types-trace:
	pnpm exec tsc --generateTrace tmp/trace
	pnpm exec analyze-trace tmp/trace

test: test-node test-browser
.PHONY: test

test-setup:
	pnpm exec firebase setup:emulators:firestore

test-node:
	pnpm exec firebase emulators:exec --only firestore "pnpm exec vitest run"

test-node-watch:
	pnpm exec firebase emulators:exec --only firestore "pnpm exec vitest"

test-browser:
	pnpm exec firebase emulators:exec --only firestore "env BROWSER=true pnpm exec vitest run --browser"

test-browser-watch:
	pnpm exec firebase emulators:exec --only firestore "env BROWSER=true pnpm exec vitest --browser"

test-system: test-system-node test-system-browser

test-system-node:
	env GOOGLE_APPLICATION_CREDENTIALS=${CURDIR}/secrets/key.json pnpm exec vitest run

test-system-node-watch:
	env GOOGLE_APPLICATION_CREDENTIALS=${CURDIR}/secrets/key.json pnpm exec vitest

test-system-browser:
	env BROWSER=true pnpm exec vitest run --browser

test-system-browser-watch:
	env BROWSER=true pnpm exec vitest --browser

test-types: build
	@cd lib && pnpm dlx @arethetypeswrong/cli --pack --exclude-entrypoints adapter/admin adapter/admin/batch adapter/admin/core adapter/admin/firebase adapter/admin/groups adapter/admin/transaction adapter/web adapter/web/batch adapter/web/core adapter/web/firebase adapter/web/groups adapter/web/transaction

build:
	@rm -rf lib
	@pnpm exec tsc -p tsconfig.lib.json
	@env BABEL_ENV=esm pnpm exec babel src --config-file ./babel.config.lib.json --source-root src --out-dir lib --extensions .mjs,.ts --out-file-extension .mjs --quiet
	@env BABEL_ENV=cjs pnpm exec babel src --config-file ./babel.config.lib.json --source-root src --out-dir lib --extensions .mjs,.ts --out-file-extension .js --quiet
	@rm -rf lib/types/*js*
	@make sync-files
	@rm -rf lib/tysts
	@make build-mts
	@cp package.json lib
	@cp *.md lib
	@cp LICENSE lib

sync-files:
	@find src \( -name '*.d.ts' -o -name '*.json' \) -print | while IFS= read -r file; do \
		dest=`echo "$$file" | sed 's|^src/|lib/|'`; \
		mkdir -p `dirname "$$dest"`; \
		rsync -av "$$file" "$$dest"; \
	done

build-mts:
	@find lib -name '*.d.ts' | while read file; do \
		new_file=$${file%.d.ts}.d.mts; \
		cp $$file $$new_file; \
	done

publish: build
	cd lib && pnpm publish --access public --no-git-checks

publish-next: build
	cd lib && pnpm publish --access public --tag next --no-git-checks