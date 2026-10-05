---
paths:
  - "apps/ias/test/**"
  - "apps/ias/e2e/**"
  - "tools/ias-golden/**"
---

# IAS tests and goldens

- `buildOf(changes)` (`test/builds.ts`) builds a test build from a few fields; every other field holds its original default.
- The goldens come from Warren's calculator at `bcc112d`, including where it differs from the game (`test/goldens/README.md`). Regenerate them with `bun run golden:generate`, never by hand and never in CI.
- A test that reads every golden case is named `goldens.<name>.test.ts`: the pre-commit hook skips it, CI runs it.
- The app reproduces Warren's calculator, including where it differs from the game, except the differences in `test/golden-deviations.ts`. It holds three kinds: `goldenDeviations` removes an original form option or field (case predicate, `removed`, `source`), a removed field reset to its default, or adds an oskill behind the divider (`added`); `floorDeviations` puts a floor under a field, `ceilingDeviations` a ceiling over one. Nothing yet adds a field the original form lacks, or changes a calculated output: the first such change designs its kind. A golden case never selects an added option: unit tests check the builds it opens. Write a deviation in terms of the case: never call the engine function it checks, or the test checks nothing.
- `goldens.form-snapshots` checks more than the form: for each kept case, `normalize` and the calculated output against the original output, skipped only for a case a floor raises, a ceiling lowers or a removed field resets.
- `goldens.form-snapshots` pins the number of skipped cases, of raised cases per floor, of lowered cases per ceiling and of reset cases per removed field. When a change moves a pinned number, read the diff, update the number and explain it in the commit message, and in the `execution.md` of the plan that drives the change, if any.
- `apps/ias/e2e/` runs outside `bun test`, through `bun run e2e`: `dist.e2e.ts` checks the built files (gzip budgets, no sourcemap, CSP, prerendered page), `smoke.e2e.ts` serves `dist/` under `/d2-lab/` (`e2e/site.ts`) and fails on any console error, page error or response of status 400 or more. `SMOKE_URL=<url> bun apps/ias/e2e/smoke.e2e.ts` runs it on a deployed site. `layout.e2e.ts` opens its `views` (builds, then a panel, list or view open) at 390 to 1440 px and fails on any axe-core violation or any problem of `layout-checks.ts`: a sideways scroll (the character strip excepted), an element out of its panel, text out of its box, text within 2 px of a border or line, text over text. A build whose content runs wider, or a new popup or panel, joins `views`; a popup that hides the page narrows its axe run with `axe`. `HEADED=1` shows the browser with each element at fault outlined in red. A budget that a change exceeds on purpose: raise it in `dist.e2e.ts` and say why in the commit.
- `test/sprites.test.ts` reads `public/game/sprites/`, which `bun run assets:extract` writes and git keeps: every offered animation needs its manifest and each sheet it names. Run it after a change to the extraction or to what the engine animates.
