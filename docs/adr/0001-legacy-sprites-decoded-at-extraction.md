# Legacy sprites, decoded at extraction, composed in the browser

The attack view draws the game's legacy 2D sprites, not D2R's HD models. `assets:extract` decodes each DCC into one sheet per layer component in a single direction, and the browser stacks the layers the build needs and plays them on the calculator's clock. Decided with the maintainer over five decision rounds.

## Considered options

- **HD models** (GR2 to glTF, three.js): the pipeline works, but colors, materials, lighting and camera differ from the game, and closing that gap is open research. Parked behind the same `Timeline` contract.
- **Decode in the browser**: serves the raw DCC files (16 directions to show one: 276 KB per view instead of 37 KB), and ships the decoder to every visitor, which makes the site distribute GPL code (`0002`).
- **Bake whole frames at extraction**: 15 KB per view and the least page code, but every outfit, shield or direction would multiply the sheets. Composing layers in the browser is what let Smite's shield picker and Holy Shield land as a few more `sh` sheets, with no other sheet redone.

## Consequences

- The sheets need `assets:extract` run on a machine with the game. They are committed, so CI builds and tests the site without the game; a missing sheet makes the view say "Animation files are missing".
- A player wears one fixed outfit; only the drawn components are extracted (about 6 MB of WebP sheets).
- One direction (4 of 64). Another direction is an extraction change, not a UI one.
