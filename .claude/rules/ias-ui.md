---
paths:
  - "apps/ias/src/ui/**"
  - "apps/ias/src/styles/**"
  - "apps/ias/public/**"
  - "apps/ias/art/**"
---

# IAS UI

- `ui/screens/calculator-state.ts` names the builds: the raw state keeps every value the player typed; `calculatorView` shows `unraised` moved within its floors and ceilings; the tables and the attack view's timeline come from the normalized build, `normalized`. A panel never writes a build: it sends a `BuildEdit`, and `applyEdit` (`ui/screens/build-edit.ts`) lands it on the raw state.
- UI text is in English. Names and field labels live in `ui/screens/labels.ts`; a row's frames per hit and per-second value in `ui/screens/hit-labels.ts`, which reads `BreakpointRow.rollback`, never the original `frames` string; the attack view's sentences, counters and controls in `ui/screens/attack-labels.ts`; hints, floor captions and table statuses in `ui/screens/option-hints.ts`. The original table headers (`Skill Level`, `WIAS`) are data: `data/rules/tables.ts`.
- The Braise theme: tokens in `src/styles/braise.css` (`--item` is the gold of the game's item names); `/theme` in `bun run dev` previews the components. `cn` merges conflicting Tailwind classes. `ui/components/ui/` holds copied shadcn code, where `prefer-readonly-parameter-types` is off.
- Base UI's Combobox ignores `filteredItems` while its input shows the selected label: filter through `items`, as `ui/screens/weapon-picker.tsx` does with its facets.
- A handler that takes a DOM event needs `oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- <reason>`: React events are mutable.
- The attack view (`ui/screens/attack-view.tsx`) loads the sheets under `public/game/sprites/`, committed output of `bun run assets:extract`: a missing file makes it say "Animation files are missing", and `e2e/smoke.e2e.ts` fails on any missing file. `useSprites` draws and crops to what the clip draws: `Clip.outfit` and `Clip.weapons`; a weapon or shield without its sheet gives "Animation files are missing". The hit count stepper and the shield controls (`ui/screens/shield-controls.tsx`) are view state, reset when the skill changes.
- `build.ts` prerenders the default build into `index.html`, and `main.tsx` hydrates it; a share link hides it until React renders the link's build. A component renders without `window`, `document` or `location`: read them in an effect or an event, and give `useSyncExternalStore` a server snapshot. A URL the page fetches is relative: the site lives under `/d2-lab/`.
- The built page carries a Content Security Policy (`build.ts`): no inline script or style except the ones it hashes. A new style attribute in the prerendered markup gets its hash at build time; anything else shows as a console error in `bun run e2e`.
- Every image in `apps/ias/public/art/` has an entry in `apps/ias/art/prompts.md` (role, date, prompt). The footer credits these images as AI-generated fan art, and the game icons and sprites to Blizzard Entertainment.
- Check a UI change with `bun run e2e`, then `agent-browser` captures at 1440 and 390 px. A share link loads the build to capture, for example `http://localhost:3000/?v=1&class=paladin&form=werebear`.
