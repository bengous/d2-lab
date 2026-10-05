# D2R game data extraction

Read game tables, strings, animation data and HD icons straight from a local
Diablo II: Resurrected install on Linux, without Windows tools. Written against
D2R `3.3.93847` (Battle.net under Wine/Lutris); every number below comes from
that build unless a source is cited.

## Entry point

```sh
./extract.sh <install dir> <out dir> [extra CASC mask]...
# example
./extract.sh "$HOME/Games/battlenet/drive_c/Program Files (x86)/Diablo II Resurrected" extracted/3.3.93847
```

- Input: the install directory, the one that holds `.build.info` (not `Data/`).
- Output: `<out dir>` must be absent or empty; the script refuses otherwise so
  two game versions never mix. The first run also builds the tool (about
  10 s); after that a run takes about 2 s.
- The install is mounted read-only for every CASC access (see Safety).
- Exit code 0 and a `VERSION` file mean a complete extraction: `VERSION` is
  written last.

Layout of `<out dir>`:

| Path | Content |
|---|---|
| `VERSION` | Game version from `.build.info`, e.g. `3.3.93847` |
| `listing.tsv` | Every CASC entry: size, name (175,824 lines) |
| `extracted.tsv` | Size and path of every extracted file |
| `files/data/data/...` | Raw files, mirroring CASC paths (`files/data/data/global/excel/weapons.txt`) |
| `animdata.tsv` | `animdata.d2` as TSV: cof, frames per direction, speed, flagged frames |
| `png/skillicons/<xx>skillicon_NN.png` | One PNG per skill icon cell, 132x130; `NN` is `IconCel` |
| `png/hireables/<name>icon.png` | Class and mercenary portraits, 120x120 |
| `png/weapons/<name>.png` | Weapon inventory icons, 98 px per inventory cell (a 1x3 weapon is 98x294) |

The default set is every `excel\*.txt`, `animdata.d2` and `eanimdata.d2`,
every `lng\strings\*.json`, the HD skill icon sheets, the HD hireable
icons, the HD weapon icons and `hd\items\items.json`, which maps an item code
to its icon: 574 files, 94 MiB. Extra masks add files to `files/` (for example
`'data:data\hd\global\ui\items\armor\*.sprite'`); `sprite2png.py` converts
them on demand.

## Calling it from another project

1. Configure two paths outside the repo, for example `D2R_CASC` (this folder)
   and `D2R_INSTALL` (the game).
2. Run `"$D2R_CASC/extract.sh" "$D2R_INSTALL" <cache dir>`, with the cache
   dir ignored by git. Delete it first when you re-extract.
3. Generate your own data file from `<cache dir>` (tables, strings, PNGs you
   need) and commit only that generated file, with the content of `VERSION`
   inside it.
4. Never commit `<cache dir>` or anything under `files/` or `png/`: they are
   Blizzard's files.

## Files here

| File | Role |
|---|---|
| `extract.sh` | Entry point above. |
| `build.sh` | Fetches CascLib at a pinned commit, applies the patch, builds `build/casc-cli`. |
| `casc-cli.cpp` | `list <mask>` and `extract <out dir> <mask>...` over a CASC storage. |
| `ro-run.sh` | `ro-run.sh <install dir> <command>...`: runs the command with the install bind-mounted read-only. |
| `casclib-readonly.patch` | Two CascLib opens of `.build.info` switched from read-write to read-only. |
| `sprite2png.py` | `.sprite` (SpA1 v31) to one PNG per frame, standard library only. |
| `animdata.py` | `animdata.d2` to TSV. |
| `check-breakpoints.py` | Derives FCR/FHR/FBR breakpoints from `animdata.tsv` and compares them with a published table. |
| `.gitignore` | Allowlist: only the files above can be staged. |

Requirements: git, cmake, g++, zlib, python3 (3.9 or later), and
unprivileged user namespaces (`unshare -rm true` must succeed).

Manual use, for files outside the default set:

```sh
D2R="$HOME/Games/battlenet/drive_c/Program Files (x86)/Diablo II Resurrected"
./ro-run.sh "$D2R" build/casc-cli "$D2R" list 'data:data\hd\global\ui\items\*'
./ro-run.sh "$D2R" build/casc-cli "$D2R" extract /tmp/out 'data:data\global\excel\weapons.txt'
```

## Install layout

- `<install>/.build.info`: pipe-separated, header on line 1. Columns used:
  `Version` (`3.3.93847`), `Branch` (`eu`), `Product` (`osi`).
- `<install>/Data/`: the CASC storage, 28 GB. `data/` holds `data.000` to
  `data.027` and 16 `.idx`; `config/`, `indices/`, `ecache/`, `osi/` sit
  beside it.

## Safety

- `ro-run.sh` makes the install read-only for the command it runs; a `touch`
  inside it fails with `Read-only file system`.
- Unpatched CascLib opens `.build.info` with `O_RDWR` (it never writes to
  it). The read-only mount would refuse that open, hence the patch. This
  failure is read from the code, not observed.
- Do not run the tool while Battle.net patches the game: the storage changes
  under it.

## Names inside CASC

- Names look like `data:data\global\excel\weapons.txt`: a `data:` prefix,
  then backslashes, all lowercase.
- Opening is case-insensitive and accepts `/` as well as `\`.
- In masks `*` also crosses `\`: `data:data\global\excel\*.txt` returns 182
  files, `base\` included. A mask that matches nothing is an error.
- `extract` writes `data:data\global\x.txt` to `<out dir>/data/data/global/x.txt`.
- Other root entries: `vfs-root` and the game binaries.
- Largest kinds by count: `.model` 58,954, `.flac` 33,100, `.texture` 31,093,
  `.dcc` 23,435, `.json` 8,159, `.cof` 3,616, `.sprite` 3,032, `.dc6` 2,562,
  `.txt` 822, `.bin` 344, `.dds` 62.

## Where the data lives

| Data | Path in CASC | Format |
|---|---|---|
| Game tables | `data:data\global\excel\*.txt` (91 tables) | TSV, CRLF, pure ASCII; a compiled `.bin` sits beside each |
| Second table set | `data:data\global\excel\base\*.txt` (91 tables) | same; meaning unknown, see below |
| Localized strings | `data:data\local\lng\strings\*.json` | JSON array of `{id, Key, enUS, frFR, deDE, ...}`, 14 languages, UTF-8 with BOM |
| Frames per animation | `data:data\global\animdata.d2`, `eanimdata.d2` | binary, see below |
| Animation layers | `data:data\global\chars\<token>\cof\*.cof` | COF, not decoded here |
| HD skill icons | `data:data\hd\global\ui\spells\<class>\<xx>skillicon.sprite` | SpA1 sheet, 60 cells per class |
| HD class and merc icons | `data:data\hd\global\ui\hireables\<name>icon.sprite` | SpA1, 120x120, 1 frame |
| HD item icons | `data:data\hd\global\ui\items\<kind>\<sub>\*.sprite` | SpA1, not checked |
| Legacy SD UI | `data:data\global\ui\**\*.dc6` | DC6 with palette, not decoded here |
| Low-res variants | `*.lowend.sprite` next to each HD sprite | SpA1 at half size |

### `excel/` versus `excel/base/`

The top-level tables are the complete set: `base/skills.txt` lacks
`Korlic's Bash` and `HeraldThorns`, `base/itemtypes.txt` lacks
`Crafted Sunder Charm`, and `base/weapons.txt` differs in `gemsockets` for
Blade, Stilleto and Legend Spike and in some dagger columns. `speed` is
identical in both. Which game mode loads `base/` is unknown: use the top-level
tables until that is known.

## Table notes for speed calculators

### Weapons (`weapons.txt`)

- `speed` is the weapon speed modifier (WSM); empty means 0.
- `code` is the stable key. Display names come from `item-names.json`, looked
  up by `code` as `Key`.
- `name` is an internal label with typos and trailing spaces: `Saber`, `Kriss`,
  `Stilleto`, `Long Siege Bow`, `Colossal Sword`, `Mithral Point`,
  `Broad Axe `, `Bearded Axe `, `Long Sword `. Never join on it.
- `wclass` is the animation class: `1hs`, `1ht`, `stf`, `bow`, `xbw`, `2ht`,
  `ht1`. `2handedwclass` adds `2hs` (two-handed swords held in two hands).
  `1or2handed` = 1 marks the swords a Barbarian can hold in one hand.
- `gemsockets` is only an upper bound; item size and item level also cap
  sockets.
- Cross-check done: the WSM of the 292 weapons of Warren's calculator
  `constants.js` all match (joined by code).

### Skills (`skills.txt`, `skilldesc.txt`)

- `charclass` uses the class codes of `playerclass.txt` (table below).
- `anim` is the player mode the skill plays (`A1`, `SC`, `SQ`, `TH`, `KK`,
  `S1` to `S3`); `seqnum` indexes a sequence table (Jab, Fend, Whirlwind,
  Frenzy...). The sequence tables are hardcoded in the game executable, not in
  these files: Warren's calculator got them from a dump of the 3.3 binary.
- `UseAttackRate` flags skills that IAS speeds up; `localdelay` and
  `globaldelay` hold cast delays.
- Attack speed from skills sits in `aurastatN` = `attackrate` with its formula
  in `aurastatcalcN`: `dm34` for Fanaticism, Quickness (Burst of Speed) and
  Wearwolf, `dm56` for Frenzy, `-dm34` for Holy Freeze, `lvl*par1` for Maul,
  `par1` for Mark of the Bear. Hex Purge uses `passivestat1` with
  `passivecalc1` = `min(30, ln56)`. The exact rounding of `dm` is not
  documented here.
- Internal skill names keep their typos too (`Wearwolf`); display names are in
  `skills.json`.
- `skilldesc.txt` column `IconCel` is the cell index in the class skill icon
  sheet. Every skill owns two cells, normal then pressed (Jab = 8, checked by
  eye).

### Classes and tokens

| Class | `playerclass.txt` code | Animation token | Skill icon file | Portrait file |
|---|---|---|---|---|
| Amazon | `ama` | `AM` | `amazon\amskillicon` | `amazonicon` |
| Sorceress | `sor` | `SO` | `sorceress\soskillicon` | `sorceressicon` |
| Necromancer | `nec` | `NE` | `necromancer\neskillicon` | `necromancericon` |
| Paladin | `pal` | `PA` | `paladin\paskillicon` | `paladinicon` |
| Barbarian | `bar` | `BA` | `barbarian\baskillicon` | `barbarianicon` |
| Druid | `dru` | `DZ` | `druid\drskillicon` | `druidicon` |
| Assassin | `ass` | `AI` | `assassin\asskillicon` | `assassinicon` |
| Warlock | `war` | `WK` | `warlock\waskillicon` | `warlockicon` |
| Werewolf (Druid) | | `40` | | |
| Werebear (Druid) | | `TG` | | |

Player modes (`plrmode.txt`): `DT NU WL RN GH TN TW A1 A2 BL SC TH KK S1 S2 S3
S4 DD`.

## `animdata.d2`

- 256 blocks. Each block is a `u32` count followed by that many 160-byte
  records: `char[8]` name, `u32` frames per direction, `u32` animation speed,
  then 144 flag bytes, one per frame.
- The name is token + mode + weapon class: `AMA11HS` is Amazon, Attack1,
  one-handed swinging. Throwing weapons use mode `TH` (`AMTH1HT`), not `A1`.
- `animdata.d2` has 3,661 records (about 30 names repeat; `animdata.py`
  prints them all, the first one wins in the scripts here). `eanimdata.d2`
  has 3,520, lacks the Warlock `WK`, and differs on 5 records. Use
  `animdata.d2`; the role of `eanimdata.d2` is unknown.
- Flag values seen: 1 (471 frames), 2 (155), 3 (4). A flag of 1 marks the
  attack frame; 2 appears on throw animations, so it is probably the missile
  launch (not verified).
- Cross-check done: frames per direction and attack frames of the weapon
  types in the `constants.js` of Warren's calculator all match (74 and 66
  entries).

## FCR, FHR and FBR

What a cast, hit-recovery or block calculator needs, and where it is:

| Need | Where | Status |
|---|---|---|
| Cast frames per class | `animdata.d2`, mode `SC` (`AMSCHTH`...) | Verified, see below |
| Hit-recovery frames | mode `GH` (`AMGHHTH`...) | Verified |
| Block frames | mode `BL` (`AMBLHTH`...) | Verified except wereforms |
| Special speeds | `anim_speed` column: Druid `SC` 208, Werewolf `SC` 168, Werebear `SC` 152, Druid `GH` with `1HS` 248, Paladin `GH` with `2HT`/`STF` 192, Werebear `GH` 184, Amazon `BL` with `1HS` 88, Werebear `BL` 200 | In the data |
| Cast sequences | `skills.txt` `anim` = `SQ`: Inferno, Lightning, Chain Lightning, Arctic Blast, Bind Demon, Cleave, Mirrored Blades (with `seqnum`) | Frame tables not in the data files (hardcoded, like the attack sequences) |
| Item stats | `itemstatcost.txt`: `item_fastercastrate` (105), `item_fastergethitrate` (99), `item_fasterblockrate` (102), `item_fasterattackrate` (93), `item_fastermovevelocity` (96) | Present |
| Property codes | `properties.txt`: `cast1-3`, `balance1-3` (FHR), `block1-3` (FBR), `swing1-3` (IAS), `move1-3` (FRW) | Present |
| Items that carry them | `uniqueitems.txt`, `setitems.txt`, `sets.txt`, `runes.txt` (runewords), `magicprefix.txt`, `magicsuffix.txt`, `gems.txt`, `cubemain.txt` | Present, by property code |
| Block chance inputs | `charstats.txt` `BlockFactor` (Amazon 25, Sorceress 20, Necromancer 20, Paladin 30, Barbarian 25, Druid 20, Assassin 25, Warlock 25), `armor.txt` `block` | Present; the block chance formula is not verified |
| Minimum cast delay | `charstats.txt` `MinimumCastingDelay` = 12 for every class | Present; meaning not verified |

Formulas, from the sources cited in `check-breakpoints.py`:

- effective bonus = `floor(bonus * 120 / (bonus + 120))`, capped at 75 for FCR.
- frames = `ceil(256 * FramesPerDirection / floor(AnimSpeed * (base + effective) / 100)) - 1`.
- `base` is 100 for FCR, 50 for FHR and FBR, and 100 for FBR under Holy
  Shield.

Verification: `python3 check-breakpoints.py <out dir>/animdata.tsv` rebuilds
34 published breakpoint rows (michaelangel007 D2 cheat sheet) from this
build's data and reproduces 32: FCR 10/10, FHR 12/12, FBR 10/12. The two
misses are Werewolf and Werebear FBR: the data gives each form the other's
published row. The FCR and FHR rows confirm that `40` is the Werewolf and `TG`
the Werebear, so either the sheet swaps its FBR rows or the game blocks with
other animations in wereforms. Not resolved.

Not checked: mercenary and Necromancer vampire-form tokens, and FRW (walk and
run speeds sit in `charstats.txt` `WalkVelocity` and `RunVelocity`).

## `.sprite` (SpA1)

| Offset | Type | Value on UI icons |
|---|---|---|
| 0 | `char[4]` | `SpA1` |
| 4 | `u16` | version, `31` |
| 6 | `u16` | visible frame width (130 on skill icons) |
| 8 | `u32` | sheet width (7920) |
| 12 | `u32` | height (130) |
| 20 | `u32` | frame count (60) |
| 32 | `u32` | pixel byte count, = width x height x 4 |
| 40 | bytes | RGBA8 pixels, row-major over the whole sheet |

- The cell stride is sheet width / frames (132 px), not the visible width
  (130).
- Checked on 29 UI icon sprites, all version 31 and uncompressed. The other
  ~3,000 sprites are not checked: `sprite2png.py` stops with an error on any
  other version rather than guess.
- `sprite2png.py` output is pixel-identical to
  `tail -c +41 f.sprite | magick -size 7920x130 -depth 8 rgba:- sheet.png`.

## When the game patches

1. Run `extract.sh` into a new `extracted/<version>` next to the previous one.
2. `diff -r --strip-trailing-cr extracted/<old>/files extracted/<new>/files`
   lists the changed files. To see changed cells, keep the extractions in a
   local git repo outside any public repo, one commit per version, and run
   `git diff --word-diff`.
3. Rerun `check-breakpoints.py` and the cross-checks of each consumer project.
4. If `CascOpenStorage` fails after a client update, update `CASCLIB_COMMIT`
   in `build.sh`, delete `build/` and rerun: CascLib follows CASC format
   changes.

## Licenses

- CascLib: MIT (Ladislav Zezula), fetched at build time, not vendored.
- The scripts, `casc-cli.cpp` and this README: ours.
- Extracted files are Blizzard's property: the root `README.md` says which
  of them this repo publishes, and on what terms.

## Open questions

- Which mode loads `excel/base/`, and what `eanimdata.d2` is for.
- Werewolf and Werebear block frames (see FCR, FHR and FBR).
- Sprite versions other than 31 (compressed variants may exist).
- COF, DC6, `.texture`, `.model`: present, not decoded.
