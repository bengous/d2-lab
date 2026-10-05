# d2-lab

Calculators for Diablo II: Resurrected. The first one is the IAS Calculator (`apps/ias`), rebuilt in TypeScript from
Warren1001's IAS Calculator.

Live: <https://bengous.github.io/d2-lab/>

## Credits

With thanks to:

- Warren1001, for the [IAS Calculator](https://github.com/Warren1001/IAS_Calculator) this one was rebuilt from. The
  goldens in `apps/ias/test/goldens/` hold its output at commit `bcc112d4b6d41a646f6abc6751daf78752157e40`, and the
  IAS Calculator is tested against them.
- RuffnecKk, of [D2RLoader](https://d2rloader.net), for the dump of the game's hardcoded player sequence tables that
  `apps/ias/src/data/rules/sequences.ts` cites.
- [D2MOO](https://github.com/ThePhrozenKeep/D2MOO) (MIT, The Phrozen Keep), read for the hardcoded sequences the
  attack animation plays.
- [OpenDiablo2](https://github.com/OpenDiablo2/OpenDiablo2) (GPL-3.0), whose DCC decoder `tools/d2-dcc/` ports.
- [CascLib](https://github.com/ladislav-zezula/CascLib) (MIT), which reads the game's storage for `tools/d2r-data/`.

The code was written with AI coding agents, and the banner and skyline art was generated with AI.

## License

The code is under the MIT License (`LICENSE`), except:

- `tools/d2-dcc/` is GPL-3.0 (its own `LICENSE`): a port of OpenDiablo2's DCC decoder. Only the extraction scripts use
  it: `apps/ias/scripts/sprites/extract-sprites.ts` runs with it. The site never ships it
  (`docs/adr/0002-gpl-dcc-decoder-isolated-in-tools.md`).
- `apps/ias/public/game/` holds icons and sprites extracted from Diablo II: Resurrected. They are Blizzard
  Entertainment's property and no license here covers them.
- `apps/ias/src/data/generated/game-data.ts` holds data extracted from the game files. It is Blizzard Entertainment's,
  and the MIT License does not cover it.
- `apps/ias/public/art/` holds AI-generated fan art that depicts Blizzard Entertainment's Diablo. The MIT License does
  not cover it.
- `apps/ias/test/goldens/` and `apps/ias/test/fixtures/original-constants.json` hold the output and the constants of
  Warren1001's IAS Calculator. They stay his work, and the MIT License does not cover them.
- `apps/ias/public/fonts/` holds Cinzel and Alegreya Sans, under the SIL Open Font License (`*-OFL.txt` next to them).

## Blizzard Entertainment

Diablo II: Resurrected is a trademark of Blizzard Entertainment, Inc. This project is fan-made and not affiliated with
Blizzard Entertainment. The extracted icons and sprites remain Blizzard Entertainment's property: on request, they
will be removed. Write to the address in `LICENSE`.
