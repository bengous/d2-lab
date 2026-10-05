# d2-lab

Bun monorepo of Diablo II: Resurrected calculators. The first one is the IAS Calculator in `apps/ias`.

`CONTEXT.md` is the glossary: use its terms in code, docs and UI text, and add a term there when one settles.

## Commands

Run them from the repo root.

```
bun run dev               # dev server of apps/ias (Bun HTML import + bun-plugin-tailwind), also serves /theme
bun run build             # apps/ias/build.ts -> apps/ias/dist/
bun run check             # oxfmt --check && oxlint (type-aware + type-check)
bun test                  # every *.test.ts outside apps/ias/e2e/, goldens included (about 110 s)
bun run e2e               # build, then apps/ias/e2e/dist.e2e.ts (budgets, CSP) and smoke.e2e.ts under /d2-lab/ in Chromium
bun run data:extract      # $D2R_INSTALL -> tools/d2r-data -> apps/ias/src/data/generated/game-data.ts
bun run assets:extract    # $D2R_INSTALL -> apps/ias/public/game/: icons, sprite sheets (committed)
bun run dcc:oracle <dir>  # local only: tools/d2-dcc against OpenDiablo2's Go decoder, on every DCC under <dir>
bun run original:dump     # Warren's calculator @bcc112d -> apps/ias/test/fixtures/original-constants.json
bun run golden:generate   # Warren's calculator @bcc112d in Chromium -> apps/ias/test/goldens/
bun run map:walkthrough   # engine + sprites -> docs/map/data-walkthrough.js
```

never: write to the D2R install; commit a raw game file (only extracted output); regenerate data, fixture or goldens in CI

On a `Could not resolve` for a new file, rerun `bun run dev`: it restarts a stale server.

## How a build flows

Paths below are under `apps/ias/src/`. The calculator is one pure pipeline around `Build` (`contracts/build.ts`):

1. `resolveForm` (`engine/available-inputs.ts`) gives the `InputSpec`: the options of each select, the fields shown, and the floors and ceilings the build imposes.
2. `normalize` (`engine/normalize.ts`) coerces the selects to what the form offers, resets the hidden fields and moves each value within its floor and ceiling.
3. `computeTables` (`engine/compute-tables.ts`) gives the `Result`: the breakpoint tables.

The attack view plays `attackTimeline` (`engine/animation.ts`) of the normalized build: the `Timeline` of its attack at `current`, drawn with the sprite sheets of `assets:extract`. The share link (`share-link/`) parses to and serializes from a normalized build. The UI keeps a raw build, shows its `calculatorView` (`ui/screens/calculator-state.ts`) and applies each `BuildEdit` (`ui/screens/build-edit.ts`). Every game or original fact is a record of `data/rules/` with its `source`.

Layers, from the bottom: `contracts` and `lib`, `data`, `engine`, `share-link`, `ui`. A layer imports only the layers below it; oxlint (`no-restricted-imports`) enforces it.

## Deploy

This repo is the public `bengous/d2-lab`. On `main`, CI (`.github/workflows/ci.yml`) runs `check`, then `deploy` publishes the tested `dist/` to GitHub Pages with `actions/deploy-pages` (https://bengous.github.io/d2-lab/), then `verify` runs `smoke.e2e.ts` and `lighthouse.e2e.ts` on the live site. The history before the public release stays in the private `bengous/d2-lab-private`.

## Common changes

- A speed or slow field: add it to `SpeedSources` or `Slows`, then `bun run check` lists the records to fill (bounds, form rule, share parameter, label, test builders). The compiler does not ask for:
  - its effect in the engine: a `levelBuffs` entry in `data/rules/buffs.ts` for a skill level, `engine/speed.ts` otherwise;
  - as a table variable: a `TableVariable` member, a `tableVariableOffers` entry (`data/rules/form-fields.ts`) and the `tableVariable` of its `levelBuffs` entry, without which `engine/speed.ts` throws at run time;
  - the parameter order that `share-link.test.ts` pins;
  - the form goldens: `goldens.form-snapshots` compares every field and option with the original form; a golden deviation removes an original option or field, and its `added` part adds an oskill. A field the original form lacks needs a new member of `AddedOptions`.
- A minimum a build imposes (an item it must carry, a skill it uses): a rule in `data/rules/floors.ts`, and its golden deviation in `floorDeviations`.
- A maximum a build imposes (a skill only an item grants, at a fixed level): a `ceilingRules` entry in `data/rules/floors.ts`, and its golden deviation in `ceilingDeviations`.
- Where the original form differs from the game (an option or a field the game forbids): a `goldenDeviations` entry in `apps/ias/test/golden-deviations.ts`.
- A skill an item grants: an `oskills` entry (`data/rules/skill-lists.ts`), a `runewordRequirements` entry for a runeword, and a `goldenDeviations` entry with `added` when the original form lacks it.
- Where the original output differs from the game: no deviation mechanism exists yet. The calculation suites (`test/golden-suite.ts`) and `goldens.form-snapshots` compare every output with the original one. Design an output deviation with the first such fix; an open candidate is the Act 5 mercenary's one-handed swing, 17 sprite frames in `animdata.d2` against the 16 of Warren's calculator.
- A text of the UI: `ui/screens/labels.ts` for names and labels, `ui/screens/hit-labels.ts` for the frames per hit and the per-second value of a row, `ui/screens/attack-labels.ts` for the attack view, `ui/screens/option-hints.ts` for hints and floor captions.
- A plan or a research note: kept outside this repo. A change of one slice needs no plan: its commit message carries the why. A fact or a decision they settle lands in the code with its full statement (a `source`, a comment), never as a link to them.

## Zone rules

Read the rule of a zone before working in it. Claude Code loads it on its own when it reads a file of the zone.

- `.claude/rules/ias-data.md`: `apps/ias/src/data/`, `apps/ias/scripts/`, `tools/d2r-data/`, `tools/d2-dcc/`.
- `.claude/rules/ias-engine.md`: `apps/ias/src/contracts/`, `engine/`, `lib/`.
- `.claude/rules/ias-share-link.md`: `apps/ias/src/share-link/`.
- `.claude/rules/ias-ui.md`: `apps/ias/src/ui/`, `src/styles/`, `apps/ias/public/`, `apps/ias/art/`.
- `.claude/rules/ias-tests.md`: `apps/ias/test/`, `apps/ias/e2e/`, `tools/ias-golden/`.
- `.claude/rules/ias-animation.md`: the attack animation across those zones (contract, engine, sprite rules, extraction, view, `tools/d2-dcc/`): the chain, its invariants, how to add an animation.

oxslop rejects plain `//` comments: use JSDoc, or `oxlint-disable-next-line <rule> -- <reason>`.

## Zones

- `apps/ias/`: the calculator. `dev.ts` holds the dev routes, `build.ts` the production build, `scripts/` the game data extraction.
- `apps/ias/src/`: contracts, lib, data, engine, share link and UI, imported as `@/...`.
- `apps/ias/test/`: unit, data and golden tests; `apps/ias/e2e/`: browser smoke test, outside `bun test`.
- `tools/d2r-data/`: game file extraction kit, see its README.
- `tools/d2-dcc/`: DCC sprite decoder, GPL-3.0 (ported from OpenDiablo2), see its README.
- `tools/ias-golden/`: constants dump and golden generation from Warren's calculator.
- `docs/adr/`: decisions a reader would otherwise undo (legacy sprites decoded at extraction, the GPL decoder kept apart). Add one only for a choice that is hard to reverse, surprising, and a real trade-off.
- `docs/map/`: the Atlas, a zoomable map of the repo and one build walked through the engine (`README.md`). A change that adds, removes or rewires a component updates the map in the same commit; `bun docs/map/check.js` validates it.
- Root: `package.json`, `bunfig.toml`, `tsconfig.base.json`, `oxlint.config.ts`, `oxfmt.config.ts`, `lefthook.yml`, `.github/workflows/ci.yml`.

## Dependencies

Every version is exact. The app's runtime and shadcn packages live in `apps/ias/package.json`; build, lint and test tooling lives in the root `package.json`.
