---
paths:
  - "apps/ias/src/contracts/**"
  - "apps/ias/src/engine/**"
  - "apps/ias/src/lib/**"
---

# IAS contracts and engine

- The engine is pure: no DOM, no clock, no state. A change to `src/contracts/` changes every layer: name it in the plan.
- The calculation goldens (`goldens.single`, `goldens.dual`, `goldens.forms-mercs`) must stay unchanged: they read no deviation, so a deliberate change of output needs an output deviation first (`AGENTS.md`, Common changes). The pre-commit hook skips them: run the full `bun test` before a commit that touches the engine or the data.
- A field subset has one name, in `contracts/build.ts`: `SpeedNumberField`, `SpeedFlag`, `SlowNumberField`, `SlowFlag`. Add a new subset there, next to its interface.
- A list with one entry per field is a `Record` over the field type, read with `keysOf` (`src/lib/keys.ts`), or a full object literal. Never a hand-written array or an `Object.fromEntries`: the compiler cannot see a missing field in either. The declaration order of such a `Record` is an order the user sees: `speedSteppers` orders the speed panel, `speedNumberParams` the share link.
- `computeTables` does not normalize. The UI and the share link hand it a normalized build; the calculation goldens hand it the original input as the page left it, hidden fields included.
- `resolveBuild` (`engine/normalize.ts`) resolves the form once and gives the coerced and normalized builds: reuse it instead of calling `resolveForm` and `normalize` in turn.
- `InputSpec.floors` and `InputSpec.ceilings` hold only the fields that count: shown, or held by `current` as the table variable.
- `engine/animation.ts` plays the speed step at `current` (`currentAttack` in `acceleration.ts`), so its length can differ from the Now row only where the original table lifts a negative first value to 0: claws on the EIAS table read 90 frames at 0 EIAS, the frames of -85. `test/goldens.animation.test.ts` names that case.
- A plain skill plays the mode of `gameData.skillModes` and lands its hit on the action frame of that mode's animdata record (`gameData.animations`), not on the `a1` one of `gameData.frames`. Without an animdata record the build is `no-animation`: the form offers no such build since Smite keeps to one-handed weapons, but a golden case can hold one. `not-modeled` names what the engine lacks and could play later: Whirlwind, Cleave, Mirrored Blades. Dodge (`skillsWithoutHit`) plays its animation and lands no hit.
- A hardcoded sequence plays the `(mode, sprite frame)` steps of `playerSequences` (`data/rules/player-sequences.ts`, read in D2MOO) for the held weapon class, at the speed of its table; `test/player-sequences.test.ts` checks each step list against `rules/sequences.ts` and animdata. Its timeline counts one use in `hits`, as its row does, and numbers each hit in its ticks. Whirlwind's D2MOO sequence disagrees with the engine's table, and Cleave and Mirrored Blades have none: all three stay `not-modeled`.
- A wereform plays the player's mode with its monster's look (`gameData.wereforms`: `40`, `tg`); a mercenary plays its `hireling.txt` mode, else the player's, with its own look and weapon class (`gameData.mercenaries`), whatever the build's weapon. Both read `gameData.monsterAnimations`. The Act 5 mercenary plays 16 of the 17 sprite frames of `0AA11HS`, as the engine counts 16.
- A hit lands on the first game frame that reaches its sprite frame, at the latest on the attack's last game frame: at extreme speeds (Hunger with 400 IAS) the tables end the attack before the action frame.
- A rollback skill's table rows and its timeline come from one recurrence, `rollbackHits` (`acceleration.ts`): change it there, never in a copy. `attackTimeline` takes the hit count; the counts the attack view offers are `hitCountChoices` (`data/rules/rollbacks.ts`).
- `attackTimeline` also takes the `Shield`: a skill in `shieldSkills` (Smite) draws its graphic in the `sh` layer, or `holyShield.component` under Holy Shield; every other skill ignores it. The view offers `shieldGraphics` (`data/rules/sprites.ts`). The hit count and the shield stay outside `Build` and the share link.
