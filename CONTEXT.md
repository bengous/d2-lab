# d2-lab

Calculators for Diablo II: Resurrected. The IAS Calculator tells how many game frames an attack takes for a build and which speed reaches the next breakpoint; its animation engine plays that attack with the game's own sprites.

## Site

**D2 Lab**:
The site that hosts the tools; its name sits at the left of the navbar.

**Tool**:
One calculator of D2 Lab, picked in the navbar's menu. The IAS Calculator is the first.
_Avoid_: app, page

**Warren's calculator**:
Warren1001's IAS Calculator at `bcc112d`, the site the IAS Calculator was rebuilt from; the goldens hold its output. In code: `original`.
_Avoid_: legacy site, legacy calculator

## Speed

**Game frame**:
One step of the game clock; the game runs 25 per second. Every frame count the calculator shows is in game frames.
_Avoid_: tick, frame alone when a sprite frame is meant

**Breakpoint**:
The speed value from which an action takes one game frame less. Between two breakpoints, more speed changes nothing the player can measure.
_Avoid_: BP

**IAS**:
Increased Attack Speed, the stat on items.

**WIAS**:
The IAS written on a weapon itself, which only speeds that weapon.

**SIAS**:
The attack speed a skill adds or removes, like Fanaticism or Frenzy.

**WSM**:
The weapon speed modifier of a weapon base: −30 for a Phase Blade, +20 for a War Hammer.

**EIAS**:
Effective IAS: converted IAS plus SIAS minus WSM, within the game's limits. The game derives the animation speed from it.

**Animation speed**:
How far an animation advances in one game frame, in 256ths of a sprite frame; 256 is one sprite frame per game frame.

**Table variable**:
The speed source a breakpoint table counts in: IAS, WIAS, a skill level.

## Attacks

**Hit**:
One blow, which can land or miss. A plain attack has one hit; a sequence has several.
_Avoid_: strike, swing

**Sequence**:
A skill whose single use makes several hits in a row: Zeal, Fury, Strafe, Fend, Dragon Talon, Jab, Frenzy, Whirlwind.

**Rollback**:
In Zeal, Fury, Strafe, Fend and Dragon Talon, after each hit but the last the animation goes back instead of finishing the swing: to its start for Zeal and Dragon Talon, part of the way for the others. Their first hits can therefore differ in length before the hits settle into a repeated rhythm.

**Last hit**:
The final hit of a rollback sequence; it plays the whole swing, so it takes longer than the hits before it.

**Hit count**:
How many hits one use of a sequence makes: 2 to 5 for Zeal with its skill level. The calculator does not know it; the player sets it in the animation view, labeled "Hits per Zeal" for Zeal.

**Attacks per second**:
25 divided by the game frames of an attack.

**Hits per second**:
For a sequence, 25 divided by the game frames of a hit before the last one: the rhythm of the repeated hit.
_Avoid_: attacks per second for a sequence

## Animation

**Legacy graphics**:
The 2D sprites of the 2000 game, which D2R still ships. The animation engine draws these. In this repo, "legacy" names only this graphics mode.
_Avoid_: classic, 2D mode

**HD graphics**:
The 3D models D2R draws by default. Not used yet.

**Sprite frame**:
One drawing of an animation; the Paladin's one-hand swing has 15 per direction. The player never sees this count.
_Avoid_: image, frame alone

**Action frame**:
The sprite frame where the hit lands: 7 for the Paladin's one-hand swing.
_Avoid_: hit frame

**Mode**:
Which animation a character plays: `a1` and `a2` attacks, `th` throw, `kk` kick, `s1` to `s4` skills, `sq` a hardcoded sequence.

**Weapon class**:
How a character holds its weapons, which picks the animation: `1hs` one-hand swing, `2ht` two-hand thrust, `bow`, `ht1` one claw, `1ss` two swords.

**Layer**:
One separately drawn part of a character: head, torso, legs, arms, right hand, left hand, shield, shoulder pads.

**Component**:
The variant of a layer: `lit`, `med` or `hvy` for armor, a helm code, a weapon graphic.

**Weapon graphic**:
The component a weapon draws in the hand layer, named by `alternategfx` in `weapons.txt`: a Phase Blade draws `crs`.

**Outfit**:
The components of the body layers. A player wears one fixed outfit: light armor, bare head, no shield. A skill that needs a shield, Smite, adds the shield the player picks in the animation view, or Holy Shield's own. A wereform or a mercenary wears its own, from the game files, with its own weapon.

**Sheet**:
The sprite frames of one layer component in one direction, prepared from the game files at extraction.

**Timeline**:
For each game frame of an attack, the mode and sprite frame shown and whether a hit lands.

## Game files

**Token**:
The two-character code of a character or monster: `pa` the Paladin, `40` the werewolf.

**DCC**:
The compressed format of one layer component's sprite frames, for one mode and weapon class, in every direction.

**COF**:
The recipe of one animation: its layers, sprite frames per direction, and the order to stack the layers at each sprite frame.

**animdata**:
The game table of animations: sprite frames per direction, animation speed, action frame.

**Palette**:
256 colors; each pixel of a DCC is an index into it, and index 0 is transparent.
