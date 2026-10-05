---
paths:
  - "apps/ias/src/contracts/animation.ts"
  - "apps/ias/src/engine/animation.ts"
  - "apps/ias/src/data/rules/sprites.ts"
  - "apps/ias/src/data/rules/player-sequences.ts"
  - "apps/ias/src/data/rules/rollbacks.ts"
  - "apps/ias/src/ui/screens/attack-*"
  - "apps/ias/src/ui/screens/shield-controls.tsx"
  - "apps/ias/src/ui/components/sprite-player.tsx"
  - "apps/ias/src/ui/hooks/use-game-clock.ts"
  - "apps/ias/scripts/sprites/**"
  - "apps/ias/scripts/skill-animations.ts"
  - "apps/ias/scripts/monsters.ts"
  - "tools/d2-dcc/**"
---

# IAS attack animation

The attack view plays the build's attack with the game's legacy sprites, at the speed the tables compute. It crosses four zones; their rules hold the local details (`ias-data.md`, `ias-engine.md`, `ias-ui.md`, `ias-tests.md`). Why it is built this way: `docs/adr/0001` and `0002`. Terms: `CONTEXT.md`, section Animation.

## The chain

1. `bun run data:extract` writes what the engine needs to know about animations into `game-data.ts`: each skill's mode (`skillModes`), animdata records (`animations`, `monsterAnimations`), weapon graphics (`WeaponData.graphic`), wereform and mercenary looks. Numbers and codes only, committed.
2. `bun run assets:extract` decodes the DCC files with `tools/d2-dcc/`, reads each COF with `scripts/sprites/cof.ts`, and writes per animation `public/game/sprites/<token>/<mode><weapon class>/`: one lossless WebP sheet per drawn layer component (`<layer>-<component>.webp`, every sprite frame side by side, direction 4 of 64; written as an indexed PNG, then converted by `magick mogrify`) and `manifest.json` (`SpriteManifest`: box, layers with their own weapon class, draw order per sprite frame). Committed: CI builds the published site from them.
3. `attackTimeline(build, hitCount, shield)` (`engine/animation.ts`) turns the normalized build into a `Timeline`: the `Clip` to draw (token, folder, weapon class, weapon graphics, outfit) and one `Tick` per game frame (mode, sprite frame position, hit). It reuses the speed steps and the rollback recurrence of the tables, so the animation cannot disagree with the Now row. It returns `Unavailable` when the engine does not model the skill or the game has no such animation.
4. The view (`ui/screens/attack-view.tsx`) fetches the manifests and sheets of the clip (`useSprites`), stacks the layers of each tick's sprite frame in manifest order on a canvas, and runs the 25 game frames per second clock (`useGameClock`).

The `Timeline` contract is the seam for a future HD renderer: it would read the same ticks and draw a 3D model instead of sheets (`docs/adr/0001`).

## Invariants

- The timeline of every golden case lasts its Now row and lands its hits where the table says: `test/goldens.animation.test.ts` (over 500,000 rows). A change to the engine's speed steps, `rollbackHits` or a sequence must keep it green.
- The screen counts game frames only. Sprite frames, the 15 drawings of an animation, never reach the UI text.
- The hit count, the shield and Holy Shield are view state: outside `Build`, outside the share link.
- `apps/ias/src/` never imports `tools/d2-dcc/` (GPL-3.0); only `apps/ias/scripts/` does.

## Adding an animation

- A skill whose mode is in `skills.txt`: nothing to write. `skillModes` gives the mode, `offeredAnimations()` extracts the sheets, the engine plays it. Run `data:extract`, `assets:extract`, then `test/sprites.test.ts` and the full `bun test`.
- A hardcoded sequence (`anim` `SQ`): its `(mode, sprite frame)` steps per weapon class go in `rules/player-sequences.ts`, with a D2MOO source; `test/player-sequences.test.ts` checks it against `rules/sequences.ts`.
- A monster look (wereform, mercenary): `scripts/monsters.ts`, then `monsterSpriteCache` extracts its folder.
- A skill the engine cannot model yet stays `not-modeled`; one the game has no animation for with a weapon is `no-animation`. Fix the form first when the game forbids the combination (`skills.txt` item types, golden deviations).

## Traps

- Each COF layer names its own weapon class: in `baa11ss`, six of nine layers read `1hs` files. Read the layer's class from the manifest, never the clip's.
- The files name a claw `ht1`, two claws `ht2`, a Barbarian's two weapons `1ss`, `1js`, `1jt` or `1st`: `animationWeaponClasses`, `dualWieldWeaponClasses`.
- COF and DCC number directions differently: `cofDirection` and `dccDirection` map direction 4 of 64 for each.
- The sprite files live in their own caches, filled read-only through `tools/d2r-data/ro-run.sh`; `D2R_INSTALL` must name the install for both extract commands. Never delete the main cache to add files.
