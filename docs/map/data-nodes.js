// One brick = one component that can be replaced or removed on its own.
// Facts come from the files each `kicker` and `src` name; a path without a
// leading apps/, tools/, docs/ or a root file is under apps/ias/src/.
//
// MAP.add(zone, id, place, label, sub, info, opts)
//   zone   zone id, or null for an outside system
//   place  [column, row] on the zone's grid (MAP.slot), or a world box
//          [x, y, w, h] for an outside system
//   label  short name (8.6 units, about 30 characters fit a brick)
//   sub    mono subtitle, "\n" between lines, at most 2 lines of 45 characters
//   info   panel content, fields listed at the top of data-zones.js
//   opts   color: a --z-* token; kind: "big" for an outside system;
//          couples: ids of bricks that must change when this one is replaced.
//          A coupling needs to be listed on one side only.
// MAP.links holds what flows between bricks; the map outlines them when a
// brick is selected, and the panel lists them. It does not draw them.
MAP.slot = ([column, row]) => [14 + column * 168, 40 + row * 58, 160, 46];
MAP.add = (zone, id, place, label, sub, info, opts) => {
  const [x, y, w, h] = zone ? MAP.slot(place) : place;
  MAP.nodes.push(Object.assign({ zone, id, x, y, w, h, label, sub, info, couples: [] }, opts || {}));
};
const L = (from, to, label) => MAP.links.push({ from, to, label });

// ---------- outside systems ----------
const EXT = { kind: "big", color: "--z-ext" };
MAP.add(null, "x-d2r", [20, 140, 240, 52], "D2R install", "3.3.93847, read-only mount", {
  "kicker": "tools/d2r-data/README.md:4-6, 83-87; AGENTS.md:25",
  "title": "D2R install",
  "lead": "Diablo II: Resurrected 3.3.93847 under Battle.net with Wine/Lutris: 28 GB of CASC storage, only ever read through a read-only mount."
}, EXT);
MAP.add(null, "x-casclib", [20, 210, 240, 52], "CascLib", "MIT, patched read-only", {
  "kicker": "tools/d2r-data/build.sh:5-14; README.md:281",
  "title": "CascLib (GitHub)",
  "lead": "MIT CASC library, fetched at commit 38a34665 and patched read-only at build time, not vendored."
}, EXT);
MAP.add(null, "x-magick", [20, 280, 240, 52], "ImageMagick 7", "magick, WebP encoding", {
  "kicker": ".claude/rules/ias-data.md:16; apps/ias/scripts/extract-assets.ts:43-45; apps/ias/scripts/sprites/extract-sprites.ts:175-198",
  "title": "ImageMagick 7",
  "lead": "Local magick binary that encodes the icons and converts the sheets to WebP during assets:extract."
}, EXT);
MAP.add(null, "x-od2", [20, 350, 240, 52], "OpenDiablo2", "GPL-3.0 Go, archived", {
  "kicker": "tools/d2-dcc/README.md:7, 31; tools/d2-dcc/oracle/go.mod:5; docs/adr/0002-gpl-dcc-decoder-isolated-in-tools.md:3",
  "title": "OpenDiablo2 (GitHub)",
  "lead": "GPL-3.0 Go project, archived since 2021. Source of the DCC port and of the oracle's reference decoder, pinned in oracle/go.mod."
}, EXT);
MAP.add(null, "x-original", [20, 520, 240, 52], "Warren's calculator", "Warren1001 @bcc112d", {
  "kicker": "README.md:12-14; tools/ias-golden/upstream.ts:5-7",
  "title": "Warren1001's IAS Calculator",
  "lead": "Warren1001/IAS_Calculator at bcc112d (v1.2.4): the golden oracle, cloned to a temp dir only while generating."
}, EXT);
MAP.add(null, "x-d2moo", [20, 600, 240, 52], "D2MOO", "game code, MIT @5596f5c", {
  "kicker": ".claude/rules/ias-data.md:11",
  "title": "D2MOO",
  "lead": "MIT reimplementation of the game code at 5596f5c, read for hard-coded sequences and rules that data/rules cite as sources."
}, EXT);
MAP.add(null, "x-chromium", [20, 900, 240, 52], "Playwright Chromium", "goldens, e2e, Lighthouse", {
  "kicker": "package.json:28; .github/workflows/ci.yml:35, 109; apps/ias/e2e/lighthouse.e2e.ts:42",
  "title": "Playwright Chromium",
  "lead": "The browser for golden generation, the original constants dump, e2e and Lighthouse. CI installs it with bunx playwright install."
}, EXT);
MAP.add(null, "x-browser", [1824, 450, 240, 52], "Player's browser", "static page under /d2-lab/", {
  "kicker": "apps/ias/build.ts:31-56; .claude/rules/ias-ui.md:17; apps/ias/e2e/site.ts:11",
  "title": "Player's browser",
  "lead": "Loads the static prerendered page under /d2-lab/ with its CSP and fetches game/ assets by relative URL. There is no server code."
}, EXT);
MAP.add(null, "x-gh-pages", [1824, 880, 240, 52], "GitHub Pages", "bengous.github.io/d2-lab", {
  "kicker": ".github/workflows/ci.yml jobs.deploy",
  "title": "GitHub Pages",
  "lead": "Serves the build that the deploy job publishes, at https://bengous.github.io/d2-lab/, with cache-control max-age=600. The repo's Pages source is GitHub Actions."
}, EXT);
MAP.add(null, "x-github", [1824, 1000, 240, 52], "GitHub repo", "bengous/d2-lab, public", {
  "kicker": "AGENTS.md (Deploy); .github/workflows/ci.yml",
  "title": "bengous/d2-lab",
  "lead": "The public repo with the source. GitHub Actions runs CI on ubuntu-24.04 for every push to main, pull request and manual run. The history before the public release stays in the private bengous/d2-lab-private."
}, EXT);

// ---------- Extraction ----------
MAP.add("extraction", "casc-kit", [0, 0], "CASC extraction kit", "tools/d2r-data/\nextract.sh \u00b7 ro-run.sh", {
  "kicker": "tools/d2r-data/extract.sh:1-39",
  "title": "D2R CASC extraction kit",
  "lead": "A shell, C++ and Python kit that reads tables, strings, animdata and HD icons from the install's CASC storage, with the install bind-mounted read-only.",
  "io": [
    [
      "Receives",
      "The install dir that holds .build.info, an empty out dir and optional extra CASC masks (README.md:11-22)"
    ],
    [
      "Produces",
      "VERSION, listing.tsv, extracted.tsv, files/ (raw CASC paths), animdata.tsv, png/skillicons, png/hireables, png/weapons (README.md:24-35)"
    ]
  ],
  "swap": "Any reader that fills the same out-dir layout can replace it. game-files.ts calls extract.sh, ro-run.sh and build/casc-cli by path (apps/ias/scripts/game-files.ts:21-22, 86-102).",
  "extend": "Pass extra CASC masks to add files to files/ (README.md:40-42). game-files.ts adds the sprite masks this way (game-files.ts:80-83).",
  "facts": [
    [
      "Default set",
      "574 files, 94 MiB (README.md:40-41)"
    ],
    [
      "Run time",
      "about 10 s on first build, then about 2 s (README.md:18-19)"
    ],
    [
      "CascLib pin",
      "38a34665 (build.sh:5)"
    ],
    [
      "Tracked files",
      "10, allowlisted (tools/d2r-data/.gitignore:1-8)"
    ],
    [
      "Breakpoint check",
      "reproduces 32 of 34 published rows (README.md:235-241)"
    ]
  ],
  "warn": "The out dir must be empty so two game versions never mix (extract.sh:10-13). Do not run it while Battle.net patches the game (README.md:96-97).",
  "see": [
    "game-cache",
    "data-extract"
  ],
  "src": "tools/d2r-data/README.md, tools/d2r-data/extract.sh, tools/d2r-data/ro-run.sh:9, tools/d2r-data/build.sh:5-22"
}, {"color": "--z-extraction", "couples": ["game-cache"]});
MAP.add("extraction", "game-cache", [1, 0], "Extraction caches", "scripts/game-files.ts\n~/.cache/d2r-data/<ver>*", {
  "kicker": "apps/ias/scripts/game-files.ts:108-188",
  "title": "Versioned extraction caches",
  "lead": "Reads the version in $D2R_INSTALL/.build.info. Reuses ~/.cache/d2r-data/<version><suffix>/ when its VERSION matches; otherwise extracts into a temp dir and renames it into place.",
  "io": [
    [
      "Receives",
      "The D2R_INSTALL env var (game-files.ts:116-122) and the kit's extract.sh, ro-run.sh and casc-cli"
    ],
    [
      "Produces",
      "GameCache {version, dir} for three caches: main, -sprites (palette plus every chars COF and DCC) and -monster-sprites (palette plus the monsters folders of the given tokens) (game-files.ts:153-188)"
    ]
  ],
  "swap": "Every extraction entry point calls gameCache, spriteCache or monsterSpriteCache (extract-data.ts:69, extract-assets.ts:236, 255). A replacement must return the same GameCache shape and files/ layout.",
  "extend": "A new cache is one cachedExtraction(suffix, extractMasks([...])) call (game-files.ts:86-115).",
  "facts": [
    [
      "Caches",
      "3: <version>, <version>-sprites, <version>-monster-sprites"
    ],
    [
      "Completeness marker",
      "VERSION, written last (game-files.ts:10, 104)"
    ],
    [
      "Shared helpers",
      "readTable, readStrings, slugify, formatWithRepoConfig (game-files.ts:25, 191, 225, 248)"
    ]
  ],
  "warn": "A cache dir without the matching VERSION throws 'remove it, then rerun' (game-files.ts:132-134). The monster cache throws when a token is missing (:179-185). Never add sprite files to the main cache, which extract.sh owns (.claude/rules/ias-data.md:21).",
  "see": [
    "casc-kit",
    "data-extract",
    "assets-extract",
    "sprite-sheets"
  ],
  "src": "apps/ias/scripts/game-files.ts"
}, {"color": "--z-extraction", "couples": ["casc-kit", "data-extract", "assets-extract", "sprite-sheets"]});
MAP.add("extraction", "data-extract", [1, 1], "Game data extractor", "bun run data:extract\nscripts/extract-data.ts", {
  "kicker": "apps/ias/scripts/extract-data.ts:1-104",
  "title": "data:extract to game-data.ts",
  "lead": "Reads weapons, item types, skills, monsters, hirelings, animdata.tsv and string tables from the main cache. Renders one TypeScript module typed as GameData and formats it with the repo's oxfmt.",
  "io": [
    [
      "Receives",
      "The main cache's GameCache (extract-data.ts:69)"
    ],
    [
      "Produces",
      "apps/ias/src/data/generated/game-data.ts: version, weapons, frames, skillModes, skillItemTypes, animations, monsterAnimations, wereforms, mercenaries (extract-data.ts:55-65)"
    ]
  ],
  "swap": "A replacement must emit the GameData contract (apps/ias/src/contracts/game-data.ts:96) and brand the weapon ids. data.test.ts checks the weapons and frames against the original fixture.",
  "extend": "Add a reader beside weapons.ts, animations.ts, monsters.ts, skill-animations.ts and skill-item-types.ts. Then add its field to Extracted and render (extract-data.ts:17-67) and to GameData.",
  "facts": [
    [
      "Weapons",
      "292 entries (measured from gameData)"
    ],
    [
      "Frame entries",
      "73 over 10 weapon classes (measured)"
    ],
    [
      "Skill modes",
      "37; skill item types 37 (measured)"
    ],
    [
      "Player animations",
      "315 animdata records (measured)"
    ],
    [
      "Monster looks",
      "2 wereforms, 4 mercenaries, 5 monster animation tokens (measured)"
    ]
  ],
  "warn": "Never edit game-data.ts by hand (.claude/rules/ias-data.md:13). Mercenary frames are not extracted: they are hand-written in rules/mercenary-frames.ts (.claude/rules/ias-data.md:15).",
  "see": [
    "game-cache",
    "assets-extract",
    "unit-tests"
  ],
  "src": "apps/ias/scripts/extract-data.ts, .claude/rules/ias-data.md:13-15"
}, {"color": "--z-extraction", "couples": ["game-cache", "c-game-data", "d-game-data"]});
MAP.add("extraction", "assets-extract", [0, 1], "Icon exporter", "bun run assets:extract\nscripts/extract-assets.ts", {
  "kicker": "apps/ias/scripts/extract-assets.ts:236-266",
  "title": "assets:extract entry point",
  "lead": "Clears public/game/ and writes portraits, skill icons and weapon icons as WebP with ImageMagick. Then hands every offered animation to the sprite pipeline.",
  "io": [
    [
      "Receives",
      "png/hireables, png/skillicons, png/weapons and the skill tables from the main cache, plus gameData.weapons for the weapon icons (extract-assets.ts:5, 219-234)"
    ],
    [
      "Produces",
      "public/game/portraits/<character>.webp, skills/<slug>.webp and weapons/<icon>.webp, then a call to extractSprites (extract-assets.ts:181-258)"
    ]
  ],
  "swap": "The UI builds the paths game/portraits, game/skills and game/weapons from its folder names and slugs (apps/ias/src/ui/screens/labels.ts:136-144).",
  "extend": "A new portrait is an entry in portraits (extract-assets.ts:48-61). A new original skill is an entry in originalSkills (:64-103), or in skillsWithoutIcon when the game has no icon (:109-112).",
  "facts": [
    [
      "Portraits",
      "12 (extract-assets.ts:48-61)"
    ],
    [
      "Skill icons",
      "36 of 38 original skills; Kick and Laying Traps have none (:109-112)"
    ],
    [
      "Weapon icons",
      "94, one per weapon family (measured)"
    ],
    [
      "Icon WebP quality",
      "85 (extract-assets.ts:42-45)"
    ]
  ],
  "warn": "It deletes public/game/ before writing (extract-assets.ts:238). It reads gameData, so run data:extract first when the weapons change. It needs ImageMagick 7 (.claude/rules/ias-data.md:16).",
  "see": [
    "sprite-sheets",
    "game-assets",
    "data-extract"
  ],
  "src": "apps/ias/scripts/extract-assets.ts"
}, {"color": "--z-extraction", "couples": ["sprite-sheets", "game-assets", "ui-form-panels"]});
MAP.add("extraction", "sprite-sheets", [0, 2], "Sprite sheet pipeline", "scripts/sprites/\noffered \u00b7 cof \u00b7 png \u00b7 sheets", {
  "kicker": "apps/ias/scripts/sprites/extract-sprites.ts:200-219",
  "title": "Sprite sheets and manifests",
  "lead": "Lists every animation the form offers that attackTimeline plays, then reads each COF. Decodes each drawn DCC component in direction 4 of 64 and writes one indexed PNG per layer component. Converts each PNG to lossless WebP and writes a manifest.json.",
  "io": [
    [
      "Receives",
      "The OfferedAnimation list from offeredAnimations(), which walks builds through resolveBuild and attackTimeline (offered-animations.ts:1-8, 117-141), plus the sprite caches"
    ],
    [
      "Produces",
      "public/game/sprites/<token>/<mode><weapon class>/<layer>-<component>.webp and manifest.json, typed SpriteManifest (extract-sprites.ts:136-166)"
    ]
  ],
  "swap": "The manifest is the SpriteManifest contract (apps/ias/src/contracts/animation.ts:38), and the UI loads it by path (apps/ias/src/ui/components/sprite-player.tsx:43). A new format changes the UI loader and sprites.test.ts with it.",
  "extend": "A skill whose mode is in skills.txt needs nothing: offeredAnimations finds it (.claude/rules/ias-animation.md:40). Another direction means changing shownDirection (extract-sprites.ts:31-32; docs/adr/0001-legacy-sprites-decoded-at-extraction.md:15).",
  "facts": [
    [
      "Animations",
      "186 manifests (measured)"
    ],
    [
      "Sheets",
      "2,353 WebP, 5,853,150 B (measured)"
    ],
    [
      "WebP vs PNG",
      "9,029,179 B down to 5,853,150 B, -35 %"
    ],
    [
      "Direction, margin",
      "4 of 64, 2 px (extract-sprites.ts:31-35)"
    ]
  ],
  "warn": "It imports the engine (offered-animations.ts:4-7), so a change to the form or to attackTimeline changes which sheets exist. Each COF layer names its own weapon class: read it from the manifest, never from the clip (.claude/rules/ias-animation.md:47).",
  "see": [
    "d2-dcc",
    "game-assets",
    "sprite-test"
  ],
  "src": "apps/ias/scripts/sprites/, .claude/rules/ias-animation.md:25"
}, {"color": "--z-extraction", "couples": ["d2-dcc", "game-assets", "sprite-test", "c-animation", "e-animation", "av-sprites"]});
MAP.add("extraction", "d2-dcc", [0, 3], "DCC decoder (GPL)", "tools/d2-dcc/\nport of OpenDiablo2 d2dcc", {
  "kicker": "tools/d2-dcc/dcc.ts:1-13",
  "title": "GPL-3.0 DCC decoder and its oracle",
  "lead": "A TypeScript port of OpenDiablo2's d2dcc at 7f92c571. It turns DCC bytes into palette-indexed frames per direction. oracle.ts compares its output with the Go original.",
  "io": [
    [
      "Receives",
      "DCC file bytes and a direction from dccDirection(direction64, count) (README.md:19-25)"
    ],
    [
      "Produces",
      "DccDirection {box, frames}: one palette index per pixel, index 0 transparent (README.md:27)"
    ]
  ],
  "swap": "Only scripts/sprites/extract-sprites.ts imports it (extract-sprites.ts:18-19; README.md:7). A replacement must return the same box and frames. Rerun bun run dcc:oracle after any change (.claude/rules/ias-data.md:22).",
  "extend": "It has no extension point. It follows the steps of dcc_direction.go (dcc.ts:1-6).",
  "facts": [
    [
      "License",
      "GPL-3.0-only (tools/d2-dcc/package.json:4)"
    ],
    [
      "Oracle run",
      "16,089 files, 257,304 directions, 0 mismatches, about 2 min 20 s (README.md:37)"
    ],
    [
      "Size",
      "2 KB gzipped, against 741 KB for the Go decoder in WebAssembly (docs/adr/0002-gpl-dcc-decoder-isolated-in-tools.md:9)"
    ],
    [
      "Code",
      "7 TS files, 702 lines, plus oracle/main.go (wc)"
    ]
  ],
  "warn": "apps/ias/src/ must never import it (ADR 0002:13), but no lint rule enforces this: the layer patterns cover @/ imports only (oxlint.config.ts:17). The oracle needs Go and the game files, so it stays out of bun test and CI (README.md:31).",
  "see": [
    "sprite-sheets",
    "adrs"
  ],
  "src": "tools/d2-dcc/README.md, tools/d2-dcc/oracle.ts, docs/adr/0002-gpl-dcc-decoder-isolated-in-tools.md"
}, {"color": "--z-extraction", "couples": ["sprite-sheets"]});
MAP.add("extraction", "game-assets", [1, 2], "Committed game assets", "apps/ias/public/game/\nWebP + manifest.json", {
  "kicker": "apps/ias/public/game/",
  "title": "Extracted assets, committed",
  "lead": "The output of assets:extract, committed so CI can build the full site. The build copies public/ into dist/.",
  "io": [
    [
      "Receives",
      "Writes from assets:extract and the sprite pipeline"
    ],
    [
      "Produces",
      "Static files the UI fetches through relative game/... URLs (labels.ts:136-144, sprite-player.tsx:43), copied into dist/ (apps/ias/build.ts:81-83)"
    ]
  ],
  "swap": "A new folder layout breaks the UI's URL builders, sprites.test.ts and the smoke test, which fails on any missing file (.claude/rules/ias-ui.md:16).",
  "extend": "Regenerate with bun run assets:extract, never by hand. Commit only extracted output, never a raw game file (AGENTS.md:25).",
  "facts": [
    [
      "Files",
      "2,681: 2,495 WebP, 186 JSON (measured)"
    ],
    [
      "By folder",
      "portraits 12, skills 36, weapons 94, sprites 2,539"
    ],
    [
      "Bytes",
      "6,815,776 (measured)"
    ],
    [
      "Tokens",
      "13: am ai ba dz ne pa so wk 40 tg rg gu 0a"
    ]
  ],
  "warn": "The files count toward the 8,300,000 B total budget (apps/ias/e2e/dist.e2e.ts:30-34).",
  "see": [
    "sprite-sheets",
    "sprite-test",
    "dist-check",
    "smoke"
  ],
  "src": "git ls-files apps/ias/public/game"
}, {"color": "--z-extraction", "couples": ["sprite-test", "smoke", "dist-check", "av-sprites"]});

// ---------- Data ----------
MAP.add("data", "d-game-data", [0, 0], "Generated game data", "data/generated/\ngame-data.ts", {
  "kicker": "data/generated/game-data.ts:4401-5090",
  "title": "gameData",
  "lead": "Numbers and codes read from the D2R files: weapon bases, frames, skill modes and item types, animdata, and wereform and mercenary looks. Never edited by hand.",
  "io": [
    [
      "Receives",
      "<code>bun run data:extract</code> from <code>$D2R_INSTALL</code> (AGENTS.md:17)."
    ],
    [
      "Produces",
      "<code>gameData: GameData</code> (game-data.ts:4401)."
    ]
  ],
  "swap": "Change <code>apps/ias/scripts/</code>, then run <code>bun run data:extract</code> (.claude/rules/ias-data.md:13). Never regenerate it in CI (AGENTS.md:25).",
  "extend": "A skill whose mode is in <code>skills.txt</code> needs no list edit: <code>skillModes</code> gives its mode (.claude/rules/ias-animation.md:40).",
  "facts": [
    [
      "Game version",
      "3.3.93847"
    ],
    [
      "Weapons",
      "292: 291 bases plus unarmed"
    ],
    [
      "Frame records",
      "73 over 10 weapon classes"
    ],
    [
      "skillModes / skillItemTypes",
      "37 / 37"
    ],
    [
      "Player animdata records",
      "315 over 8 classes"
    ],
    [
      "Monster tokens",
      "5 (40, tg, rg, gu, 0a), 17 records"
    ],
    [
      "Lines",
      "5090"
    ]
  ],
  "warn": "<code>skill-item-types.ts</code> runs <code>parseSkillId</code> on every key of <code>skillItemTypes</code> at import (data/rules/skill-item-types.ts:88-92). A generated skill that <code>skills.ts</code> lacks throws on load.",
  "see": [
    "c-game-data",
    "d-gear",
    "e-frames",
    "e-animation"
  ],
  "src": "apps/ias/src/data/generated/game-data.ts:1-15,4401-5090"
}, {"color": "--z-data", "couples": ["c-game-data", "d-gear", "d-skills"]});
MAP.add("data", "d-skills", [0, 2], "Skill rules", "rules/skills.ts, skill-rule.ts\nsequences, rollbacks, skill-lists", {
  "kicker": "data/rules/skills.ts:40-258",
  "title": "Skills, sequences, rollbacks, skill lists",
  "lead": "Each skill's family (simple, whirlwind, sequence, rollback), frames, animation speed and SIAS. Also the sequence frames, the rollback factors, the skills each class offers and the skills items grant.",
  "io": [
    [
      "Receives",
      "<code>constants.js</code> and <code>calculator.js</code> of Warren's calculator at <code>bcc112d</code>, <code>skills.txt</code>, D2MOO (one source per record)."
    ],
    [
      "Produces",
      "<code>skillRule</code>, <code>parseSkillId</code>, <code>sequenceSiasPenalty</code>, <code>rollbacks</code>, <code>hitCountChoices</code>, <code>sequenceFrames</code>, <code>commonSkills</code>, <code>classSkills</code>, <code>oskills</code>."
    ]
  ],
  "swap": "The engine reads <code>skillRule</code> through <code>resolveContext</code> (engine/context.ts:39) and the skill lists through <code>skillOptions</code> (engine/available-inputs.ts:62-87). The UI reads it in hit-labels.ts:93-97, attack-view.tsx:152-168 and skill-groups.ts:2.",
  "extend": "A skill: a <code>skillRules</code> entry (skills.ts:40-258), its class list in <code>classSkills</code> (skill-lists.ts:20-65) and a name in <code>skillNames</code> (ui/screens/labels.ts:81-120). A skill an item grants: an <code>oskills</code> entry (skill-lists.ts:80-109), a <code>runewordRequirements</code> entry for a runeword, and a <code>goldenDeviations</code> entry with <code>added</code> when the original form lacks it (AGENTS.md:55).",
  "facts": [
    [
      "Skill rules",
      "38"
    ],
    [
      "Families",
      "4"
    ],
    [
      "Rollback rules",
      "5: fury, strafe, fend, zeal, dragonTalon"
    ],
    [
      "Sequence frame rules",
      "8"
    ],
    [
      "Class skill lists",
      "12 characters"
    ],
    [
      "Oskills",
      "4"
    ],
    [
      "Lines",
      "590 in 5 files"
    ]
  ],
  "warn": "<code>parseSkillId</code> runs at import in several rule files (skill-lists.ts:4-6, equipment.ts:86-88, buffs.ts:98, floors.ts:21, form-fields.ts:36-42). A renamed slug throws on load.",
  "see": [
    "e-speed",
    "e-frames",
    "e-form",
    "ui-text"
  ],
  "src": "apps/ias/src/data/rules/skills.ts; skill-rule.ts:53-62; sequences.ts:26-52; rollbacks.ts:14-85; skill-lists.ts:12-109"
}, {"color": "--z-data", "couples": ["e-form", "e-speed", "e-frames", "e-acceleration", "ui-text", "av-view"]});
MAP.add("data", "d-form", [0, 3], "Form and bounds", "rules/form-fields.ts, field-values\nfloors, characters, default-build", {
  "kicker": "data/rules/form-fields.ts:84-181",
  "title": "Field rules, offers, bounds, floors, ceilings",
  "lead": "When each field shows, which table variables and wereforms a build is offered, each field's default and bounds, the floors and ceilings a build imposes, the set of player classes, and the original initial build.",
  "io": [
    [
      "Receives",
      "<code>index.html</code> and <code>calculator.js</code> of Warren's calculator at <code>bcc112d</code>, <code>runes.txt</code>, <code>uniqueitems.txt</code>, project decisions."
    ],
    [
      "Produces",
      "<code>fieldRules</code>, <code>tableVariableOffers</code>, <code>tableVariableFallbacks</code>, <code>fixedTableVariables</code>, <code>wereformOffers</code>, <code>speedFields</code>, <code>slowFields</code>, <code>variableFields</code>, <code>floorRules</code>, <code>ceilingRules</code>, <code>playerCharacters</code>, <code>originalInitialState</code>."
    ]
  ],
  "swap": "Readers: <code>resolveForm</code> (engine/available-inputs.ts:81-92), <code>normalize</code> (engine/normalize.ts:4), <code>resolveFloors</code> (engine/floors.ts:4-7), the share link bounds (share-link/params.ts:12-18) and the UI labels (ui/screens/labels.ts:13).",
  "extend": "Three recipes:<ul><li>A minimum a build imposes: a <code>floorRules</code> entry (floors.ts:24-80). Use a <code>runeword</code> rule when <code>neededRuneword</code> names the item, else a <code>facts</code> test, and add its <code>floorDeviations</code> entry.</li><li>A maximum: a <code>ceilingRules</code> entry (floors.ts:93-101) and a <code>ceilingDeviations</code> entry (AGENTS.md:52-53; .claude/rules/ias-data.md:18).</li><li>A table variable offer: a <code>tableVariableOffers</code> entry, in select order (form-fields.ts:215-254).</li></ul>",
  "facts": [
    [
      "fieldRules",
      "23"
    ],
    [
      "tableVariableOffers",
      "9"
    ],
    [
      "fixedTableVariables",
      "1 (Dodge)"
    ],
    [
      "floorRules / ceilingRules",
      "7 / 1"
    ],
    [
      "Player classes",
      "8"
    ],
    [
      "Lines",
      "523 in 5 files"
    ]
  ],
  "warn": "<code>tableVariableOffers</code> is an array, not a <code>Record</code>: a new <code>TableVariable</code> compiles without an offer (form-fields.ts:216; AGENTS.md:49). <code>resolveFloors</code> throws when two rules floor the same field (engine/floors.ts:91-96).",
  "see": [
    "e-form",
    "e-normalize",
    "sl-params",
    "ui-text"
  ],
  "src": "apps/ias/src/data/rules/form-fields.ts; field-values.ts:22-98; floors.ts:24-101; characters.ts:4-13; default-build.ts:17-51"
}, {"color": "--z-data", "couples": ["e-form", "e-normalize", "sl-params", "ui-text"]});
MAP.add("data", "d-gear", [0, 1], "Weapons and runewords", "rules/equipment.ts\nskill-item-types, weapon-categories", {
  "kicker": "data/rules/equipment.ts:1-292",
  "title": "Weapon requirements, runewords, categories",
  "lead": "Which weapons each character and skill may hold in each hand, the runewords a build needs (Beast, Chaos, Passion) and their bases, and the categories of the weapon list.",
  "io": [
    [
      "Receives",
      "<code>gameData.skillItemTypes</code>, <code>calculator.js</code> of Warren's calculator, <code>runes.txt</code>, D2MOO."
    ],
    [
      "Produces",
      "<code>weaponRequirements</code>, <code>skillItemTypeRequirements</code>, <code>runewordRequirements</code>, <code>runewordBases</code>, <code>isRunewordBase</code>, <code>secondaryCandidates</code>, <code>classItemUsers</code>, <code>unarmedAlwaysAllowed</code>, <code>weaponCategories</code>."
    ]
  ],
  "swap": "Readers: <code>weaponOffer</code> and <code>neededRuneword</code> (engine/weapon-offer.ts:5-19), <code>resolveFloors</code> (engine/floors.ts:4), the weapon panel (ui/screens/weapon-panel.tsx:7), the picker groups (ui/screens/weapon-groups.ts:4).",
  "extend": "A skill's weapon types come from <code>skills.txt</code> through <code>skill-item-types.ts</code>. Never hand-write one in <code>weaponRequirements</code> (.claude/rules/ias-data.md:17). A runeword needs four entries: a <code>RunewordId</code> member, a <code>runewordBases</code> entry, a <code>runewordRequirements</code> entry and a <code>runewordWeaponHints</code> entry (ui/screens/option-hints.ts:100-113).",
  "facts": [
    [
      "weaponRequirements",
      "17"
    ],
    [
      "skillItemTypeRequirements",
      "32, derived"
    ],
    [
      "runewordRequirements",
      "4"
    ],
    [
      "Runewords",
      "3: beast, chaos, passion"
    ],
    [
      "Weapon categories",
      "18"
    ],
    [
      "Lines",
      "437 in 3 files"
    ]
  ],
  "warn": "<code>RunewordId</code> is a closed union (equipment.ts:5). <code>runewordBases</code> and <code>runewordWeaponHints</code> are <code>Record</code>s over it, but <code>runewordRequirements</code> and the wereform and skill hint texts are not (ui/screens/option-hints.ts:25-90).",
  "see": [
    "e-form",
    "ui-weapon-picker",
    "ui-text"
  ],
  "src": "apps/ias/src/data/rules/equipment.ts; skill-item-types.ts:14-92; weapon-categories.ts:1-53"
}, {"color": "--z-data", "couples": ["e-form", "ui-text", "ui-weapon-picker", "d-form"]});
MAP.add("data", "d-speed", [0, 4], "Speed constants", "rules/buffs.ts, caps.ts, animation.ts\ndual-wield, mercenary-frames", {
  "kicker": "data/rules/buffs.ts:51-108",
  "title": "Buffs, caps and frame constants",
  "lead": "The EIAS each skill level grants (<code>levelBuffs</code>), slows, EIAS and IAS caps, weapon animation speeds, wereform frames, starting frames, dual-wield averaging and mercenary frames.",
  "io": [
    [
      "Receives",
      "<code>constants.js</code> and <code>calculator.js</code> of Warren's calculator at <code>bcc112d</code>."
    ],
    [
      "Produces",
      "<code>levelBuffs</code>, <code>maxSkillLevel</code>, <code>holyFreeze</code>, <code>markOfTheBear</code>, <code>flatSlows</code>, <code>eiasLimits</code>, <code>iasAccelerationCaps</code>, <code>weaponIasCaps</code>, <code>firstRowFloor</code>, <code>weaponClassTraits</code>, <code>weaponAnimationSpeeds</code>, <code>wereformFrames</code>, <code>oneHandedGrip</code>, <code>offHandFirstHitFrames</code>, <code>gameFramesPerSecond</code>, <code>weaponSpeedAveraging</code>, <code>mercenaryFrames</code>."
    ]
  ],
  "swap": "The engine reads it in speed.ts:2-13, levels.ts:2, frames.ts:3-4, acceleration.ts:3-4 and compute-tables.ts:3-4. The UI reads <code>gameFramesPerSecond</code> and <code>levelBuffs</code> formulas (ui/hooks/use-game-clock.ts:3; ui/screens/option-hints.ts:10-11).",
  "extend": "A speed field's effect as a skill level: a <code>levelBuffs</code> entry. As a table variable, it also needs its <code>tableVariable</code>, without which <code>engine/speed.ts</code> throws at run time (AGENTS.md:48-49).",
  "facts": [
    [
      "levelBuffs",
      "8"
    ],
    [
      "Max skill level",
      "60"
    ],
    [
      "EIAS limits",
      "-85 to 75, 150 in a wereform"
    ],
    [
      "IAS acceleration caps",
      "88 one-handed, 83 two-handed, 78 mercenary"
    ],
    [
      "Game frames per second",
      "25"
    ],
    [
      "Lines",
      "282 in 5 files"
    ]
  ],
  "warn": "<code>iasAccelerationCaps.differenceFromGame</code>: Warren's calculator gives the Barbarian 83 with a two-handed weapon instead of 88, and v1 reproduces this on purpose (caps.ts:20-28).",
  "see": [
    "e-speed",
    "e-frames",
    "e-acceleration"
  ],
  "src": "apps/ias/src/data/rules/buffs.ts; caps.ts; animation.ts; dual-wield.ts; mercenary-frames.ts"
}, {"color": "--z-data", "couples": ["e-speed", "e-frames", "e-acceleration", "ui-text"]});
MAP.add("data", "d-sprites", [0, 5], "Sprite and sequence rules", "rules/sprites.ts\nplayer-sequences.ts", {
  "kicker": "data/rules/sprites.ts:1-151",
  "title": "How a player is drawn",
  "lead": "Class tokens, the fixed outfit, animation weapon classes, dual-wield classes, shield skills and graphics, Holy Shield and skills without a hit. Also the step lists of hardcoded sequences, read in D2MOO.",
  "io": [
    [
      "Receives",
      "<code>plrtype.txt</code>, <code>animdata.d2</code>, <code>armor.txt</code>, <code>weapons.txt</code> at 3.3.93847, D2MOO at <code>5596f5c</code>, project decisions."
    ],
    [
      "Produces",
      "<code>characterTokens</code>, <code>spriteOutfit</code>, <code>animationWeaponClasses</code>, <code>dualWieldWeaponClasses</code>, <code>leftHandWeaponClasses</code>, <code>skillsWithoutHit</code>, <code>shieldSkills</code>, <code>shieldGraphics</code>, <code>holyShield</code>, <code>playerSequences</code>."
    ]
  ],
  "swap": "<code>attackTimeline</code> reads it (engine/animation.ts:16-27). The attack view reads <code>shieldGraphics</code> and <code>shieldSkills</code> (ui/screens/attack-view.tsx:10), and the extraction reads them to write sheets (.claude/rules/ias-data.md:16).",
  "extend": "A hardcoded sequence (<code>anim</code> <code>SQ</code>): its (mode, sprite frame) steps per weapon class go in <code>playerSequences</code> with a D2MOO source. <code>test/player-sequences.test.ts</code> checks it (.claude/rules/ias-animation.md:41).",
  "facts": [
    [
      "Player tokens",
      "8"
    ],
    [
      "Shield graphics",
      "9"
    ],
    [
      "Sequences with steps",
      "9 skills"
    ],
    [
      "Lines",
      "261 in 2 files"
    ]
  ],
  "warn": "Whirlwind's D2MOO sequence disagrees with the engine's table, and Cleave and Mirrored Blades have none. All three stay <code>not-modeled</code> (player-sequences.ts:53-57; .claude/rules/ias-engine.md:19).",
  "see": [
    "e-animation",
    "av-view",
    "av-shield"
  ],
  "src": "apps/ias/src/data/rules/sprites.ts:6-151; player-sequences.ts:8-110"
}, {"color": "--z-data", "couples": ["e-animation", "av-view", "av-shield"]});
MAP.add("data", "d-original-text", [0, 6], "Original table headers", "rules/tables.ts", {
  "kicker": "data/rules/tables.ts:4-25",
  "title": "Original table headers",
  "lead": "The table column headers of Warren's calculator.",
  "io": [
    [
      "Receives",
      "<code>calculator.js</code> of Warren's calculator at <code>bcc112d</code>."
    ],
    [
      "Produces",
      "<code>tableVariableLabels</code>, <code>framesColumnLabel</code>."
    ]
  ],
  "swap": "<code>engine/table-header.ts</code> reads the headers (table-header.ts:3).",
  "facts": [
    [
      "Table header labels",
      "9"
    ],
    [
      "Lines",
      "25"
    ]
  ],
  "warn": "Only <code>test/original.ts</code> (lines 12, 194) calls <code>tableHeader</code>. The UI headers come from <code>tableVariables[...].column</code> in ui/screens/labels.ts (breakpoints-panels.tsx:211), so editing tables.ts changes the golden comparison, not the screen.",
  "see": [
    "e-tables",
    "ui-text"
  ],
  "src": "apps/ias/src/data/rules/tables.ts; apps/ias/src/engine/table-header.ts:7-15"
}, {"color": "--z-data", "couples": ["e-tables"]});

// ---------- Contracts ----------
MAP.add("contracts", "c-build", [0, 0], "Build", "contracts/build.ts", {
  "kicker": "contracts/build.ts:1-86",
  "title": "Build and its fields",
  "lead": "The one value the pipeline passes around: character, wereform, skill, two weapons, one-handed flag, table variable, <code>current</code>, speed sources and slows.",
  "io": [
    [
      "Receives",
      "Nothing: pure types."
    ],
    [
      "Produces",
      "<code>Build</code>, <code>SpeedSources</code>, <code>Slows</code>, <code>TableVariable</code>, <code>CharacterId</code>, <code>Wereform</code>, branded <code>SkillId</code> and <code>WeaponId</code>, and the field subsets <code>SpeedNumberField</code>, <code>SpeedFlag</code>, <code>SlowNumberField</code>, <code>SlowFlag</code>."
    ]
  ],
  "swap": "Every layer reads <code>Build</code>. Records keyed by its unions fail at compile time: <code>fieldRules</code>, <code>speedFields</code>, <code>variableFields</code>, the share link name records, <code>speedSteppers</code>, <code>tableVariables</code>, <code>characterNames</code>.",
  "extend": "A speed or slow field: add it to <code>SpeedSources</code> or <code>Slows</code>, run <code>bun run check</code> and fill the records it lists. The compiler does not ask for its engine effect, a <code>tableVariableOffers</code> entry, the pinned share order or the form goldens (AGENTS.md:47-51). A new field subset goes here, next to its interface (.claude/rules/ias-engine.md:12).",
  "facts": [
    [
      "CharacterId members",
      "12: 8 players, 4 mercenaries"
    ],
    [
      "TableVariable members",
      "9"
    ],
    [
      "SpeedSources fields",
      "12: 11 numbers, 1 flag"
    ],
    [
      "Slows fields",
      "5: 2 numbers, 3 flags"
    ],
    [
      "Build fields",
      "10"
    ],
    [
      "Lines",
      "86"
    ]
  ],
  "warn": "<code>SkillId</code> and <code>WeaponId</code> are branded strings with no check here: <code>parseSkillId</code> (data/rules/skills.ts:266-272) and the generated <code>branded</code> (data/generated/game-data.ts:11-15) create them.",
  "see": [
    "c-inputs",
    "d-form",
    "sl-params",
    "ui-state"
  ],
  "src": "apps/ias/src/contracts/build.ts:1-86; AGENTS.md:47-51"
}, {"color": "--z-contracts", "couples": ["d-form", "e-normalize", "sl-params", "ui-text", "ui-form-panels"]});
MAP.add("contracts", "c-inputs", [1, 0], "InputSpec and Result", "contracts/inputs.ts\ncontracts/result.ts", {
  "kicker": "contracts/inputs.ts:1-49; contracts/result.ts:1-36",
  "title": "Form spec and calculation result",
  "lead": "What the form offers for a build (<code>InputSpec</code>: options, shown fields, floors, ceilings) and what the calculation returns (<code>Result</code>: tables of <code>BreakpointRow</code>).",
  "io": [
    [
      "Receives",
      "Nothing: pure types."
    ],
    [
      "Produces",
      "<code>FieldId</code>, <code>InputSpec</code>, <code>Floors</code>, <code>Ceilings</code>, <code>FloorOrigin</code>, <code>Result</code>, <code>BreakpointTable</code>, <code>TableRole</code>, <code>BreakpointRow</code>, <code>RollbackHits</code>."
    ]
  ],
  "swap": "<code>resolveForm</code> builds the spec, <code>computeTables</code> builds the result, the share link reads the spec, and the UI reads both.",
  "extend": "A new table kind: a <code>TableRole</code> member (result.ts:26) and its caption in <code>tableCaptions</code> (ui/screens/labels.ts:294-299), a <code>Record</code> the compiler checks.",
  "facts": [
    [
      "FieldId members",
      "23: 6 named, 12 speed, 5 slow"
    ],
    [
      "InputSpec fields",
      "8"
    ],
    [
      "TableRole members",
      "4: main, off-hand, merged, odd-hits"
    ],
    [
      "Lines",
      "85"
    ]
  ],
  "warn": "<code>BreakpointRow.frames</code> is the original string the goldens pin. The UI reads <code>rollback</code> and <code>hits</code>, never <code>frames</code> (result.ts:14; .claude/rules/ias-ui.md:12).",
  "see": [
    "c-build",
    "e-form",
    "e-tables",
    "ui-tables"
  ],
  "src": "apps/ias/src/contracts/inputs.ts:11-49; apps/ias/src/contracts/result.ts:3-36"
}, {"color": "--z-contracts", "couples": ["e-form", "e-tables", "ui-tables", "sl-params"]});
MAP.add("contracts", "c-signatures", [2, 0], "Function signatures", "contracts/engine.ts\ncontracts/share-link.ts", {
  "kicker": "contracts/engine.ts:1-26; contracts/share-link.ts:1-15",
  "title": "Engine and share link signatures",
  "lead": "The types of <code>Normalize</code>, <code>AvailableInputs</code>, <code>WithTableVariable</code>, <code>ComputeTables</code>, <code>PrimaryTable</code>, <code>Locate</code>, <code>ParseShareLink</code> and <code>SerializeShareLink</code>, plus <code>ShareLinkError</code>.",
  "io": [
    [
      "Receives",
      "Nothing: pure types."
    ],
    [
      "Produces",
      "The signatures that normalize.ts:70, available-inputs.ts:209, with-table-variable.ts:8, compute-tables.ts:137, primary-table.ts:3, locate.ts:9, parse.ts:62 and serialize.ts:10 implement."
    ]
  ],
  "swap": "Each implementation is typed by its alias: change both together.",
  "extend": "A new share link error kind is a contract change (.claude/rules/ias-share-link.md:10). Add it to <code>ShareLinkError</code> and to <code>shareLinkErrorText</code> (share-link/error-text.ts:4-16).",
  "facts": [
    [
      "Engine signatures",
      "6"
    ],
    [
      "ShareLinkError kinds",
      "3: unsupported-version, unknown-value, out-of-range"
    ]
  ],
  "warn": "The <code>Normalize</code> doc says it resets hidden fields, then raises each field under its floor (contracts/engine.ts:5-9). The code also lowers each field over its ceiling (engine/normalize.ts:17).",
  "see": [
    "e-normalize",
    "e-tables",
    "sl-parse",
    "sl-error-text"
  ],
  "src": "apps/ias/src/contracts/engine.ts:1-26; apps/ias/src/contracts/share-link.ts:1-15"
}, {"color": "--z-contracts", "couples": ["e-normalize", "e-form", "e-tables", "sl-parse", "sl-serialize", "sl-error-text"]});
MAP.add("contracts", "c-animation", [3, 0], "Animation contract", "contracts/animation.ts", {
  "kicker": "contracts/animation.ts:1-137",
  "title": "Timeline, Clip and SpriteManifest",
  "lead": "What the animation engine plays and the view draws: a <code>Timeline</code> (a <code>Clip</code> and one <code>Tick</code> per game frame) or <code>Unavailable</code>. Also <code>SpriteManifest</code>, the shape of each extracted <code>manifest.json</code>.",
  "io": [
    [
      "Receives",
      "Nothing: pure types."
    ],
    [
      "Produces",
      "<code>Timeline</code>, <code>Tick</code>, <code>Clip</code>, <code>Outfit</code>, <code>Shield</code>, <code>Unavailable</code>, <code>SpriteManifest</code>, <code>Mode</code>, <code>LayerCode</code>, <code>AnimationWeaponClass</code>, <code>SequenceSteps</code>."
    ]
  ],
  "swap": "<code>attackTimeline</code> writes it and the attack view reads it. The extraction writes <code>SpriteManifest</code> files that <code>useSprites</code> reads (.claude/rules/ias-animation.md:25-27).",
  "extend": "A new renderer reads the same <code>Timeline</code>: it is the seam for a future HD renderer (.claude/rules/ias-animation.md:29).",
  "facts": [
    [
      "LayerCode values",
      "16"
    ],
    [
      "Mode values",
      "9"
    ],
    [
      "AnimationWeaponClass values",
      "14"
    ],
    [
      "Lines",
      "137"
    ]
  ],
  "warn": "The <code>SpriteLayer.components</code> doc names each sheet with a <code>.png</code> extension (contracts/animation.ts:33). The view fetches <code>.webp</code> (ui/components/sprite-player.tsx:83).",
  "see": [
    "e-animation",
    "av-sprites",
    "av-view"
  ],
  "src": "apps/ias/src/contracts/animation.ts:1-137"
}, {"color": "--z-contracts", "couples": ["e-animation", "av-view", "av-scene", "av-sprites"]});
MAP.add("contracts", "c-game-data", [4, 0], "GameData shape", "contracts/game-data.ts", {
  "kicker": "contracts/game-data.ts:1-132",
  "title": "Shape of the generated game data",
  "lead": "The type of <code>game-data.ts</code>: weapons, frames per weapon class and character, skill modes, skill item types, animdata, and wereform and mercenary looks.",
  "io": [
    [
      "Receives",
      "Nothing: pure types."
    ],
    [
      "Produces",
      "<code>GameData</code>, <code>WeaponData</code>, <code>WeaponClass</code>, <code>ItemClass</code>, <code>FrameData</code>, <code>SkillItemTypes</code>, <code>MonsterLook</code>, <code>MercenaryLook</code>."
    ]
  ],
  "swap": "The generated file is typed by it (data/generated/game-data.ts:8). To change the file, change <code>apps/ias/scripts/</code> and rerun <code>bun run data:extract</code> (.claude/rules/ias-data.md:13).",
  "extend": "A new extracted fact: a <code>GameData</code> field, then the extraction script that writes it (outside this scope).",
  "facts": [
    [
      "GameData fields",
      "9"
    ],
    [
      "WeaponClass values",
      "10"
    ],
    [
      "ItemClass values",
      "13"
    ],
    [
      "Lines",
      "132"
    ]
  ],
  "warn": "<code>frames</code> covers only the 8 player classes. Mercenary frames are hand-written in <code>rules/mercenary-frames.ts</code> (.claude/rules/ias-data.md:15).",
  "see": [
    "d-game-data",
    "e-frames"
  ],
  "src": "apps/ias/src/contracts/game-data.ts:11-132"
}, {"color": "--z-contracts", "couples": ["d-game-data"]});
MAP.add("contracts", "lib-keys", [5, 0], "keysOf", "lib/keys.ts", {
  "kicker": "lib/keys.ts:1-9",
  "title": "Typed record keys",
  "lead": "Returns the keys of a <code>Record</code> in declaration order, typed as its key union.",
  "io": [
    [
      "Receives",
      "A <code>Record</code> over a string union."
    ],
    [
      "Produces",
      "Its keys, in declaration order."
    ]
  ],
  "swap": "Five files call it: engine/available-inputs.ts:40, share-link/params.ts:69,264-267, ui/screens/speed-panel.tsx:27-33, ui/screens/attack-view.tsx:123, ui/screens/weapon-groups.ts:35.",
  "extend": "Use it for any list with one entry per field, instead of a hand-written array or <code>Object.fromEntries</code>, which the compiler cannot check (.claude/rules/ias-engine.md:13).",
  "facts": [
    [
      "Lines",
      "9"
    ],
    [
      "Files that call it",
      "5"
    ]
  ],
  "warn": "Declaration order is visible to the user: <code>speedSteppers</code> orders the speed panel, and <code>speedNumberParams</code> orders the share link (.claude/rules/ias-engine.md:13).",
  "see": [
    "sl-params",
    "ui-form-panels"
  ],
  "src": "apps/ias/src/lib/keys.ts:1-9"
}, {"color": "--z-contracts"});

// ---------- Engine ----------
MAP.add("engine", "e-form", [0, 0], "resolveForm", "engine/available-inputs.ts\nengine/weapon-offer.ts", {
  "kicker": "engine/available-inputs.ts:166-209",
  "title": "Form resolution",
  "lead": "Coerces the selects in the canonical order (character, wereform, skill, primary, secondary, table variable) and builds the <code>InputSpec</code>: options, shown fields, floors and ceilings.",
  "io": [
    [
      "Receives",
      "A raw <code>Build</code>."
    ],
    [
      "Produces",
      "<code>ResolvedForm</code>: the coerced selects plus <code>spec</code> (available-inputs.ts:31-38). <code>availableInputs</code> returns the spec alone (available-inputs.ts:209). Also <code>weaponOffer</code> and <code>neededRuneword</code> (weapon-offer.ts:116-175)."
    ]
  ],
  "swap": "Keep <code>AvailableInputs</code> (contracts/engine.ts:12). Callers: <code>resolveBuild</code> (engine/normalize.ts:57), the share link select params (share-link/params.ts:230-258), the weapon panel (ui/screens/weapon-panel.tsx:144).",
  "extend": "Extend a rule list first: <code>fieldRules</code>, <code>tableVariableOffers</code>, <code>weaponRequirements</code>, <code>runewordRequirements</code>, <code>floorRules</code>, <code>ceilingRules</code> (.claude/rules/ias-data.md:12).",
  "facts": [
    [
      "Lines",
      "384 in 2 files"
    ],
    [
      "Weapon requirements checked",
      "49: 17 hand-written, 32 from skills.txt (weapon-offer.ts:24)"
    ],
    [
      "Default build spec",
      "11 skill options with the divider, 256 primary weapons, 3 table variables, 12 fields shown"
    ]
  ],
  "warn": "A skill that hides the table variable without a <code>fixedTableVariables</code> entry throws (available-inputs.ts:97-105). A hidden select offers only the value it resets to (available-inputs.ts:166-170).",
  "see": [
    "d-form",
    "d-gear",
    "e-normalize",
    "sl-params"
  ],
  "src": "apps/ias/src/engine/available-inputs.ts:31-209; apps/ias/src/engine/weapon-offer.ts:1-175"
}, {"color": "--z-engine", "couples": ["e-normalize", "sl-params", "ui-form-panels"]});
MAP.add("engine", "e-normalize", [1, 0], "normalize", "engine/normalize.ts, floors.ts\nwith-table-variable, default-build", {
  "kicker": "engine/normalize.ts:55-70",
  "title": "Normalize and bounds",
  "lead": "<code>resolveBuild</code> resolves the form once and returns the coerced build and <code>normalize(build)</code>: hidden fields reset to defaults, every value moved within its floor and ceiling. The brick also holds <code>withTableVariable</code> and <code>defaultBuild</code>.",
  "io": [
    [
      "Receives",
      "A raw <code>Build</code>; for <code>withTableVariable</code>, a <code>TableVariable</code>."
    ],
    [
      "Produces",
      "<code>ResolvedBuild</code> with spec, coerced and normalized (normalize.ts:10-19); <code>resolveFloors</code>, <code>resolveCeilings</code> and <code>withBounds</code> (floors.ts:78-149); <code>defaultBuild</code> (default-build.ts:6)."
    ]
  ],
  "swap": "Keep <code>Normalize</code> and <code>WithTableVariable</code> (contracts/engine.ts:10,15). Callers: <code>calculatorView</code> (ui/screens/calculator-state.ts:34,50), <code>applyEdit</code> (build-edit.ts:45), <code>parseShareLink</code> (parse.ts:92), <code>serializeShareLink</code> (serialize.ts:11).",
  "extend": "A new speed field goes in <code>resetHidden</code> (normalize.ts:31-51) and <code>withBounds</code> (floors.ts:134-147). Both are full object literals, so the compiler asks for it.",
  "facts": [
    [
      "Lines",
      "248 in 4 files"
    ],
    [
      "Default build",
      "Amazon, human, Standard, unarmed, IAS table, current 0"
    ]
  ],
  "warn": "<code>computeTables</code> does not normalize: the UI and share link pass a normalized build, while the calculation goldens pass the original input as the page left it (.claude/rules/ias-engine.md:14). Reuse <code>resolveBuild</code> instead of calling <code>resolveForm</code>, then <code>normalize</code> (.claude/rules/ias-engine.md:15).",
  "see": [
    "e-form",
    "sl-parse",
    "ui-state"
  ],
  "src": "apps/ias/src/engine/normalize.ts:1-70; floors.ts:1-149; with-table-variable.ts:4-23; default-build.ts:5-6"
}, {"color": "--z-engine", "couples": ["ui-state", "sl-parse", "sl-serialize", "sl-params"]});
MAP.add("engine", "e-speed", [0, 1], "Speed and EIAS", "engine/speed.ts, levels.ts\nengine/context.ts", {
  "kicker": "engine/speed.ts:1-230",
  "title": "Context, SIAS, EIAS, variable value",
  "lead": "Resolves a build into a <code>Context</code> (skill rule, weapons, dual wield). Then computes SIAS, EIAS values per hand, the last acceleration a table tries, and the table variable value that reaches an EIAS need.",
  "io": [
    [
      "Receives",
      "A <code>Build</code> (context.ts:34-45) and the rules of buffs.ts, caps.ts, dual-wield.ts and skills.ts."
    ],
    [
      "Produces",
      "<code>Context</code>, <code>weaponById</code>, <code>eiasValues</code>, <code>maxAcceleration</code>, <code>limitEias</code>, <code>variableValue</code>, <code>iasToEias</code>, <code>eiasToIas</code>, <code>levelEias</code>, <code>levelFromEias</code>, <code>variableBuff</code>."
    ]
  ],
  "swap": "Callers: acceleration.ts:8-14, compute-tables.ts:16, and option-hints for <code>levelEias</code>, <code>variableBuff</code> and <code>iasToEias</code> (ui/screens/option-hints.ts:13-14).",
  "extend": "A speed source that is not a skill level: its effect in <code>engine/speed.ts</code> (AGENTS.md:48).",
  "facts": [
    [
      "Lines",
      "364 in 3 files"
    ]
  ],
  "warn": "If no <code>levelBuffs</code> entry has the table variable as its <code>tableVariable</code>, <code>skillLevelBuff</code> throws (speed.ts:184-192; AGENTS.md:49).",
  "see": [
    "d-speed",
    "e-acceleration",
    "e-frames"
  ],
  "src": "apps/ias/src/engine/speed.ts; levels.ts; context.ts"
}, {"color": "--z-engine", "couples": ["e-acceleration", "e-tables", "ui-text"]});
MAP.add("engine", "e-frames", [1, 1], "Frames", "engine/frames.ts", {
  "kicker": "engine/frames.ts:1-152",
  "title": "Frames of a skill with a weapon class",
  "lead": "Frames per direction, action frame, first-hit frames, animation speed, grip class and starting frame of the build's skill with a weapon class.",
  "io": [
    [
      "Receives",
      "A <code>Context</code> and a <code>WeaponClass</code>."
    ],
    [
      "Produces",
      "<code>framesPerDirection</code>, <code>actionFrame</code>, <code>firstHitFrames</code>, <code>animationSpeed</code>, <code>gripClass</code>, <code>startingFrame</code>."
    ]
  ],
  "swap": "Callers: acceleration.ts:7, compute-tables.ts:14, animation.ts:30.",
  "extend": "A skill's frames come from its <code>SkillRule</code> (<code>frames</code>, <code>firstHitFrames</code>, <code>animationSpeed</code>, <code>startingFrames</code>) in data/rules/skills.ts. Extend the rule before adding an engine branch (.claude/rules/ias-data.md:12).",
  "facts": [
    [
      "Lines",
      "152"
    ]
  ],
  "warn": "<code>frameData</code> throws when neither <code>gameData.frames</code> nor <code>mercenaryFrames</code> holds the character and weapon class (frames.ts:8-23).",
  "see": [
    "d-speed",
    "d-skills",
    "d-game-data",
    "e-acceleration"
  ],
  "src": "apps/ias/src/engine/frames.ts:1-152"
}, {"color": "--z-engine", "couples": ["e-acceleration", "e-animation"]});
MAP.add("engine", "e-acceleration", [0, 2], "Acceleration steps", "engine/acceleration.ts\nengine/merge.ts", {
  "kicker": "engine/acceleration.ts:42-378",
  "title": "Speed steps, rollback recurrence, Whirlwind merge",
  "lead": "Walks every acceleration where the animation speed changes and turns each step into frames. Produces single-hit tables, the rollback recurrence <code>rollbackHits</code>, the step at <code>current</code> for the animation, and the merged Whirlwind table.",
  "io": [
    [
      "Receives",
      "A <code>Context</code>, a hand, first-hit frames, a <code>RollbackRule</code>."
    ],
    [
      "Produces",
      "<code>singleHitTable</code>, <code>rollbackTables</code>, <code>groupHits</code>, <code>rollbackNotation</code>, <code>currentAttack</code>, <code>currentRollback</code>, <code>mergeHands</code>."
    ]
  ],
  "swap": "<code>computeTables</code> builds its rows from it (compute-tables.ts:5-15). <code>attackTimeline</code> plays <code>currentAttack</code> and <code>currentRollback</code> (animation.ts:28).",
  "extend": "A rollback skill: a <code>rollbacks</code> entry (data/rules/rollbacks.ts:14-55). Its tables and its timeline both come from <code>rollbackHits</code> (.claude/rules/ias-engine.md:22).",
  "facts": [
    [
      "Lines",
      "445 in 2 files"
    ]
  ],
  "warn": "<code>rollbackHits</code> is the one recurrence behind rollback rows and timelines: change it there, never in a copy (.claude/rules/ias-engine.md:22). <code>test/goldens.animation.test.ts</code> checks each golden case's timeline against its Now row (.claude/rules/ias-animation.md:33).",
  "see": [
    "e-speed",
    "e-frames",
    "e-tables",
    "e-animation"
  ],
  "src": "apps/ias/src/engine/acceleration.ts:1-378; merge.ts:22-67"
}, {"color": "--z-engine", "couples": ["e-tables", "e-animation"]});
MAP.add("engine", "e-tables", [1, 2], "computeTables", "engine/compute-tables.ts\nlocate, primary-table, table-header", {
  "kicker": "engine/compute-tables.ts:137-143",
  "title": "Breakpoint tables",
  "lead": "Builds the <code>Result</code>: one <code>BreakpointTable</code> per role (main, off-hand, merged, odd-hits), rows converted to the table variable. <code>locate</code> finds the Now and Next rows, and <code>primaryTable</code> picks the merged table or the first.",
  "io": [
    [
      "Receives",
      "A normalized <code>Build</code>."
    ],
    [
      "Produces",
      "<code>Result</code> (tables). <code>locate</code> gives now and next, or <code>null</code>. <code>primaryTable(result)</code> gives one table."
    ]
  ],
  "swap": "Keep <code>ComputeTables</code>, <code>Locate</code> and <code>PrimaryTable</code> (contracts/engine.ts:17-26). <code>calculatorView</code> calls all three (ui/screens/calculator-state.ts:35-42).",
  "facts": [
    [
      "Lines",
      "199 in 4 files"
    ],
    [
      "Default build",
      "1 table, 6 rows"
    ]
  ],
  "warn": "The calculation goldens read no deviation. A deliberate output change needs an output deviation first, and none exists yet (.claude/rules/ias-engine.md:11; AGENTS.md:56). <code>locate</code> handles unsorted original tables (locate.ts:4-8).",
  "see": [
    "e-acceleration",
    "d-original-text",
    "ui-state",
    "ui-tables"
  ],
  "src": "apps/ias/src/engine/compute-tables.ts; locate.ts; primary-table.ts; table-header.ts"
}, {"color": "--z-engine", "couples": ["ui-state", "ui-tables", "c-inputs"]});
MAP.add("engine", "e-animation", [0, 3], "attackTimeline", "engine/animation.ts", {
  "kicker": "engine/animation.ts:289-314",
  "title": "Attack timeline",
  "lead": "Turns a normalized build, a hit count and a shield into a <code>Timeline</code>: the <code>Clip</code> to draw and one <code>Tick</code> per game frame. Returns <code>Unavailable</code> (<code>not-modeled</code> or <code>no-animation</code>) when it cannot.",
  "io": [
    [
      "Receives",
      "A normalized <code>Build</code>, <code>hitCount</code> (<code>null</code> for the main table's hits), a <code>Shield</code>."
    ],
    [
      "Produces",
      "<code>Timeline</code> or <code>Unavailable</code>."
    ]
  ],
  "swap": "Only <code>AttackSection</code> calls it (ui/screens/attack-view.tsx:239-248). A future HD renderer would read the same <code>Timeline</code> (.claude/rules/ias-animation.md:29).",
  "extend": "A skill whose mode is in <code>skills.txt</code>: nothing to write. Run <code>data:extract</code>, <code>assets:extract</code>, then <code>test/sprites.test.ts</code> and the full <code>bun test</code>. A monster look goes in <code>scripts/monsters.ts</code> (.claude/rules/ias-animation.md:40-42).",
  "facts": [
    [
      "Lines",
      "314"
    ],
    [
      "Default build timeline",
      "token am, class hth, 11 ticks, 1 hit"
    ]
  ],
  "warn": "A wereform or mercenary plays its own look and weapon class, whatever the build's weapon (animation.ts:170-235; .claude/rules/ias-engine.md:20). A hit lands on the attack's last game frame at the latest (animation.ts:61-69).",
  "see": [
    "e-acceleration",
    "d-sprites",
    "d-game-data",
    "av-view"
  ],
  "src": "apps/ias/src/engine/animation.ts:1-314; .claude/rules/ias-engine.md:17-23"
}, {"color": "--z-engine", "couples": ["av-view", "c-animation"]});

// ---------- Share link ----------
MAP.add("share-link", "sl-params", [0, 0], "shareParams", "share-link/params.ts", {
  "kicker": "share-link/params.ts:158-268",
  "title": "Link parameters",
  "lead": "The link's parameters in the order they are validated and written: the selects in the form's canonical order, then <code>current</code>, the speed fields and the slows. Each parameter has an <code>apply</code> and an <code>emit</code>.",
  "io": [
    [
      "Receives",
      "A <code>Build</code>, a raw value and the <code>InputSpec</code>."
    ],
    [
      "Produces",
      "An <code>ApplyResult</code> per parameter. <code>emit</code> gives the text to write, or <code>undefined</code> when the value equals the default build's (params.ts:37-38,47-48)."
    ]
  ],
  "swap": "<code>parse.ts</code> and <code>serialize.ts</code> both walk it (parse.ts:24-27,74-77; serialize.ts:13-17).",
  "extend": "A speed or slow field: its name in <code>speedNumberParams</code>, <code>speedFlagParams</code>, <code>slowNumberParams</code> or <code>slowFlagParams</code> (params.ts:162-187), at its field's place. The pinned list in <code>test/share-link.test.ts</code> moves with it (.claude/rules/ias-share-link.md:9).",
  "facts": [
    [
      "Parameters",
      "25, plus v"
    ],
    [
      "Format version",
      "1"
    ],
    [
      "Lines",
      "268"
    ]
  ],
  "warn": "The declaration order of the name records is the link order, which <code>test/share-link.test.ts</code> pins (lines 11, 80). Two kinds of error: a slug the form does not offer, or a parameter for a hidden field, is <code>unknown-value</code>; a number outside its bounds is <code>out-of-range</code> (.claude/rules/ias-share-link.md:10).",
  "see": [
    "e-form",
    "d-form",
    "sl-parse",
    "sl-serialize"
  ],
  "src": "apps/ias/src/share-link/params.ts:1-268"
}, {"color": "--z-share-link", "couples": ["sl-parse", "sl-serialize"]});
MAP.add("share-link", "sl-parse", [1, 0], "parseShareLink", "share-link/parse.ts", {
  "kicker": "share-link/parse.ts:57-93",
  "title": "Parse a link",
  "lead": "Checks the version, applies each parameter in <code>shareParams</code> order starting from <code>defaultBuild</code>, rejects unknown names, and ends with <code>normalize</code>.",
  "io": [
    [
      "Receives",
      "The query string."
    ],
    [
      "Produces",
      "<code>{ ok: true, build }</code> or <code>{ ok: false, error }</code>. The first error wins (parse.ts:57-61)."
    ]
  ],
  "swap": "Keep <code>ParseShareLink</code> (contracts/share-link.ts:8-12). <code>loadLink</code> calls it (ui/screens/calculator-state.ts:71).",
  "extend": "A new error kind is a contract change (.claude/rules/ias-share-link.md:10).",
  "facts": [
    [
      "Lines",
      "93"
    ]
  ],
  "warn": "Parsing ignores the order of a link, so older links still load (.claude/rules/ias-share-link.md:9). A repeated parameter is <code>unknown-value</code> on its second occurrence (parse.ts:36-38).",
  "see": [
    "sl-params",
    "e-normalize",
    "ui-state"
  ],
  "src": "apps/ias/src/share-link/parse.ts:1-93"
}, {"color": "--z-share-link", "couples": ["ui-state"]});
MAP.add("share-link", "sl-serialize", [1, 1], "serializeShareLink", "share-link/serialize.ts", {
  "kicker": "share-link/serialize.ts:5-24",
  "title": "Write a link",
  "lead": "Writes <code>?v=1</code> and the parameters of <code>normalize(build)</code> that differ from the default build, in <code>shareParams</code> order.",
  "io": [
    [
      "Receives",
      "A <code>Build</code>: the raw UI state (calculator.tsx:11)."
    ],
    [
      "Produces",
      "A search string that starts with <code>?</code>."
    ]
  ],
  "swap": "Keep <code>SerializeShareLink</code> (contracts/share-link.ts:14-15). <code>copyLink</code> calls it (ui/screens/calculator.tsx:9-13).",
  "extend": "Nothing to add here: a new parameter comes from <code>shareParams</code>.",
  "facts": [
    [
      "Lines",
      "24"
    ],
    [
      "Default build link",
      "?v=1 (test/share-link.test.ts:57-58)"
    ]
  ],
  "warn": "A round trip gives back <code>normalize(build)</code>. <code>goldens.share-link</code> checks this on every golden case (.claude/rules/ias-share-link.md:11).",
  "see": [
    "sl-params",
    "sl-parse",
    "ui-state"
  ],
  "src": "apps/ias/src/share-link/serialize.ts:1-24"
}, {"color": "--z-share-link", "couples": ["ui-state"]});
MAP.add("share-link", "sl-error-text", [0, 1], "Error text", "share-link/error-text.ts", {
  "kicker": "share-link/error-text.ts:3-16",
  "title": "Link error sentence",
  "lead": "The line the screen shows for each <code>ShareLinkError</code>.",
  "io": [
    [
      "Receives",
      "A <code>ShareLinkError</code>."
    ],
    [
      "Produces",
      "An English sentence."
    ]
  ],
  "swap": "<code>LinkErrorNotice</code> calls it (ui/components/link-error-notice.tsx:4).",
  "extend": "A new error kind adds a branch here.",
  "facts": [
    [
      "Lines",
      "16"
    ],
    [
      "Error kinds",
      "3"
    ]
  ],
  "see": [
    "sl-parse",
    "ui-kit"
  ],
  "src": "apps/ias/src/share-link/error-text.ts:1-16"
}, {"color": "--z-share-link", "couples": ["c-signatures"]});

// ---------- UI ----------
MAP.add("ui", "ui-state", [0, 0], "Calculator state", "screens/calculator.tsx\ncalculator-state.ts, build-edit.ts", {
  "kicker": "ui/screens/calculator-state.ts:33-76",
  "title": "Raw state, view, edits",
  "lead": "<code>Calculator</code> holds the raw <code>Build</code>. <code>calculatorView</code> derives the shown, unraised and normalized builds, the spec and the located tables. <code>applyEdit</code> lands each <code>BuildEdit</code> on the raw state.",
  "io": [
    [
      "Receives",
      "The page's <code>search</code> string (calculator.tsx:15-18) and <code>BuildEdit</code>s from the panels."
    ],
    [
      "Produces",
      "<code>CalculatorView</code> (calculator-state.ts:18-31), passed to <code>CalculatorScreen</code>. A share link on copy (calculator.tsx:9-13)."
    ]
  ],
  "swap": "Keep the <code>CalculatorScreen</code> props (calculator-screen.tsx:23-41) and the <code>BuildEdit</code> union (build-edit.ts:19-23).",
  "extend": "A new kind of edit: a <code>BuildEdit</code> member and its branch in <code>applyEdit</code> (build-edit.ts:19-57).",
  "facts": [
    [
      "Lines",
      "177 in 3 files"
    ],
    [
      "BuildEdit kinds",
      "4: build, speed, slows, table-variable"
    ]
  ],
  "warn": "<code>applyEdit</code> keeps the raw selects, so a hidden or refused weapon or skill comes back once it is offered again (build-edit.ts:25-30). <code>calculator-state.ts</code> imports the <code>LocatedTable</code> type from a view module, <code>breakpoints-panels.tsx</code> (calculator-state.ts:11).",
  "see": [
    "e-normalize",
    "e-tables",
    "sl-parse",
    "ui-layout"
  ],
  "src": "apps/ias/src/ui/screens/calculator.tsx:1-44; calculator-state.ts:1-76; build-edit.ts:1-57"
}, {"color": "--z-ui", "couples": ["ui-layout", "ui-form-panels", "ui-tables"]});
MAP.add("ui", "ui-layout", [1, 0], "Screen and chrome", "screens/calculator-screen.tsx\npage-chrome.tsx", {
  "kicker": "ui/screens/calculator-screen.tsx:43-85",
  "title": "Page layout and site chrome",
  "lead": "Lays out the page: banner, navbar with the Tools menu and the copy-link button, title, link error notice, the panels in order, then the footer with the game patch and the skyline.",
  "io": [
    [
      "Receives",
      "<code>CalculatorScreenProps</code>: build, normalized, inputs, tables, primary, <code>onEdit</code>, <code>onCopyLink</code>, linkError."
    ],
    [
      "Produces",
      "The page markup. Each panel gets its slice."
    ]
  ],
  "swap": "Only <code>Calculator</code> renders it (calculator.tsx:28-42).",
  "extend": "A panel: render it here with <code>build</code>, <code>inputs</code> and <code>onEdit</code> (calculator-screen.tsx:67-77). A second tool: an item in <code>ToolMenu</code> (page-chrome.tsx:73-114).",
  "facts": [
    [
      "Lines",
      "275 in 2 files"
    ],
    [
      "Panels",
      "7, wereform only when shown"
    ]
  ],
  "warn": "The Tools menu holds one hard-coded item, IAS Calculator (page-chrome.tsx:104-107).",
  "see": [
    "ui-state",
    "ui-form-panels",
    "ui-tables",
    "ui-kit"
  ],
  "src": "apps/ias/src/ui/screens/calculator-screen.tsx:1-85; page-chrome.tsx:1-190"
}, {"color": "--z-ui", "couples": ["ui-state"]});
MAP.add("ui", "ui-form-panels", [0, 1], "Form panels", "character, wereform, skill,\nweapon, speed panels", {
  "kicker": "ui/screens/speed-panel.tsx:145-178",
  "title": "One panel per form step",
  "lead": "Character portraits, wereform toggle, skill chips grouped by origin, weapon rows with WSM and weapon IAS, speed steppers and PvP slows. Each panel sends <code>BuildEdit</code>s.",
  "io": [
    [
      "Receives",
      "The shown <code>build</code>, <code>inputs</code> and <code>onEdit</code>."
    ],
    [
      "Produces",
      "<code>BuildEdit</code>s (speed-panel.tsx:74, weapon-panel.tsx:84, character-panel.tsx:107)."
    ]
  ],
  "swap": "Each panel needs only <code>build</code>, <code>inputs</code> and <code>onEdit</code> (calculator-screen.tsx:68-74).",
  "extend": "A speed field shows on its own once <code>speedSteppers</code> has its entry (labels.ts:231-263) and <code>fieldRules</code> shows it: the panel reads <code>keysOf(speedSteppers)</code> (speed-panel.tsx:27).",
  "facts": [
    [
      "Lines",
      "703 in 6 files"
    ],
    [
      "Character tiles",
      "8 classes, 4 mercenaries"
    ]
  ],
  "warn": "The speed panel leaves weapon IAS to the weapon panel through a hand-written set (speed-panel.tsx:25; weapon-panel.tsx:49-62). The character grid hard-codes 8 and 4 columns (character-panel.tsx:109). <code>playerClasses</code> and <code>mercenaries</code> are hand-written arrays (labels.ts:41-57).",
  "see": [
    "ui-text",
    "ui-weapon-picker",
    "ui-kit",
    "ui-state"
  ],
  "src": "apps/ias/src/ui/screens/character-panel.tsx; wereform-panel.tsx; skill-panel.tsx; skill-groups.ts; weapon-panel.tsx; speed-panel.tsx"
}, {"color": "--z-ui", "couples": ["ui-text", "ui-weapon-picker"]});
MAP.add("ui", "ui-weapon-picker", [0, 2], "Weapon picker", "screens/weapon-picker.tsx\nweapon-facets, weapon-groups", {
  "kicker": "ui/screens/weapon-picker.tsx:181-233",
  "title": "Weapon search with facets",
  "lead": "A searchable combobox over the offered weapons, grouped by category, then family and tier, with category and tier facets.",
  "io": [
    [
      "Receives",
      "<code>weapons</code>, the chosen <code>value</code>, <code>onValueChange</code> (weapon-panel.tsx:79-88)."
    ],
    [
      "Produces",
      "The chosen <code>WeaponData</code>."
    ]
  ],
  "swap": "Only <code>WeaponSearch</code> in the weapon panel renders it (weapon-panel.tsx:79).",
  "extend": "A category: a <code>WeaponCategory</code> member and a <code>weaponCategories</code> entry (data/rules/weapon-categories.ts:1-53), plus its name in <code>weaponCategoryNames</code> (labels.ts:147-166).",
  "facts": [
    [
      "Lines",
      "519 in 3 files"
    ],
    [
      "Categories",
      "18"
    ],
    [
      "Tiers",
      "3"
    ]
  ],
  "warn": "Base UI's Combobox ignores <code>filteredItems</code> while its input shows the selected label, so filter through <code>items</code> (.claude/rules/ias-ui.md:14; weapon-picker.tsx:197). <code>categoryOf</code> throws for a weapon whose first item type is in no category (weapon-groups.ts:50-58).",
  "see": [
    "ui-form-panels",
    "d-gear",
    "ui-kit"
  ],
  "src": "apps/ias/src/ui/screens/weapon-picker.tsx; weapon-facets.tsx; weapon-groups.ts"
}, {"color": "--z-ui", "couples": ["ui-form-panels"]});
MAP.add("ui", "ui-tables", [1, 1], "Breakpoint tables", "screens/breakpoints-panels.tsx\ncomponents/breakpoint-table.tsx", {
  "kicker": "ui/screens/breakpoints-panels.tsx:57-223",
  "title": "Now, Next and all tables",
  "lead": "The Now and Next breakpoint tiles with the attack view below them. Then every table with its Now, Next and below-floor rows, and the table variable toggle.",
  "io": [
    [
      "Receives",
      "<code>LocatedTable</code>s, the primary one, <code>inputs.floors</code>, the normalized build."
    ],
    [
      "Produces",
      "Tiles, tables and <code>table-variable</code> edits (breakpoints-panels.tsx:198-200)."
    ]
  ],
  "swap": "<code>CalculatorScreen</code> renders <code>BreakpointsPanel</code> and <code>TablesPanel</code> (calculator-screen.tsx:75-76).",
  "extend": "A table caption per <code>TableRole</code> goes in <code>tableCaptions</code> (labels.ts:294-306).",
  "facts": [
    [
      "Lines",
      "458 in 3 files (with summary-tile.tsx)"
    ]
  ],
  "warn": "<code>components/breakpoint-table.tsx</code> imports from <code>ui/screens</code> (hit-labels and option-hints, lines 14-20). It is the only component that depends on screen modules.",
  "see": [
    "ui-text",
    "av-view",
    "ui-state"
  ],
  "src": "apps/ias/src/ui/screens/breakpoints-panels.tsx; ui/components/breakpoint-table.tsx; ui/components/summary-tile.tsx"
}, {"color": "--z-ui", "couples": ["ui-text", "av-view"]});
MAP.add("ui", "ui-text", [1, 2], "UI texts", "screens/labels.ts, hit-labels.ts\noption-hints.ts", {
  "kicker": "ui/screens/labels.ts:1-306",
  "title": "Names, row texts, hints",
  "lead": "Every name and label (<code>labels.ts</code>), the frames per hit and per-second value of a row (<code>hit-labels.ts</code>), and the hints, floor captions and table statuses (<code>option-hints.ts</code>).",
  "io": [
    [
      "Receives",
      "Rules and game data (labels.ts:13-14; option-hints.ts:9-14; hit-labels.ts:3-4)."
    ],
    [
      "Produces",
      "<code>characterNames</code>, <code>skillName</code>, <code>tableVariables</code>, <code>speedSteppers</code>, <code>slowSteppers</code>, <code>framesText</code>, <code>perSecond</code>, <code>skillHint</code>, <code>wereformHint</code>, <code>runewordWeaponHints</code>, <code>boundProps</code>, <code>tableVariableTips</code>."
    ]
  ],
  "swap": "Panels, tables and the attack view read it (speed-panel.tsx:15-22, breakpoints-panels.tsx:14-22, attack-view.tsx:34, attack-labels.ts:5).",
  "extend": "Each UI text goes to the file named for its kind (AGENTS.md:57). UI text is in English (.claude/rules/ias-ui.md:12).",
  "facts": [
    [
      "Lines",
      "662 in 3 files"
    ],
    [
      "Skill names",
      "38"
    ],
    [
      "Skills without icon",
      "2: kick, laying-traps"
    ]
  ],
  "warn": "<code>skillNames</code> and <code>skillHints</code> are <code>Map</code>s, not <code>Record</code>s: a new skill compiles, then <code>skillName</code> throws (labels.ts:81-133). <code>levelFormulaText</code> throws for a linear formula, so a table variable over a linear buff would throw on load (option-hints.ts:193-195, 225-259).",
  "see": [
    "ui-form-panels",
    "ui-tables",
    "d-skills",
    "d-speed"
  ],
  "src": "apps/ias/src/ui/screens/labels.ts; hit-labels.ts; option-hints.ts"
}, {"color": "--z-ui", "couples": ["ui-form-panels", "ui-tables", "av-view", "av-labels"]});
MAP.add("ui", "ui-kit", [1, 3], "Components and theme", "ui/components/, hooks/\nstyles/braise.css, theme-preview", {
  "kicker": "styles/braise.css:1-158",
  "title": "Component kit and Braise theme",
  "lead": "Own components (panel, number stepper, segmented toggle, choice group, chips, tiles, tips, link notice), copied shadcn code in <code>components/ui/</code>, browser hooks, and the Braise theme tokens, previewed at <code>/theme</code>.",
  "io": [
    [
      "Receives",
      "Props from screens and tokens from <code>braise.css</code>."
    ],
    [
      "Produces",
      "Themed components. <code>useMediaQuery</code> and <code>useStoredFlag</code>, each with a server snapshot (use-media-query.ts:21-24; use-stored-flag.ts:32-35)."
    ]
  ],
  "swap": "Screens import components by path. <code>index.html</code> and <code>theme.html</code> link <code>braise.css</code> (index.html:28; theme.html:7).",
  "extend": "A token: a variable in <code>:root</code> and its <code>--color-*</code> alias in <code>@theme inline</code> (braise.css:37-104). <code>cn</code> merges conflicting Tailwind classes (.claude/rules/ias-ui.md:13).",
  "facts": [
    [
      "Own component files",
      "16 in this brick (3 more in ui-tables and av-sprites)"
    ],
    [
      "shadcn files",
      "6, 601 lines"
    ],
    [
      "Root tokens",
      "25"
    ],
    [
      "Utilities",
      "4: ember-glow, fog-glow, ember-edge, ember-fill"
    ]
  ],
  "warn": "<code>components/ui/</code> holds copied shadcn code, where <code>prefer-readonly-parameter-types</code> is off (oxlint.config.ts:55-60). A component renders without <code>window</code>, <code>document</code> or <code>location</code> because <code>build.ts</code> prerenders (.claude/rules/ias-ui.md:17).",
  "see": [
    "ui-layout",
    "ui-form-panels",
    "app-html"
  ],
  "src": "apps/ias/src/ui/components/; ui/hooks/use-media-query.ts; ui/hooks/use-stored-flag.ts; styles/braise.css; ui/theme-preview.tsx; ui/theme-preview/"
}, {"color": "--z-ui", "couples": ["ui-form-panels", "ui-tables", "ui-layout"]});

// ---------- Attack view ----------
MAP.add("attack-view", "av-view", [0, 1], "AttackView", "screens/attack-view.tsx", {
  "kicker": "ui/screens/attack-view.tsx:226-312",
  "title": "Attack section and player",
  "lead": "A Watch the attack button unfolds the section. It computes the timeline now and at the next breakpoint, holds the hit count and the shield as view state, and renders the scene, sentence, film strip, comparison rows and controls.",
  "io": [
    [
      "Receives",
      "The normalized <code>build</code>, the <code>now</code> row, and the <code>next</code> row or <code>null</code> (attack-view.tsx:226-232)."
    ],
    [
      "Produces",
      "Calls to <code>attackTimeline</code> (attack-view.tsx:239-248) and the rendered player."
    ]
  ],
  "swap": "Keep the <code>AttackView</code> props. <code>BreakpointsPanel</code> is its only caller (breakpoints-panels.tsx:102).",
  "extend": "A rollback skill's hit count range: a <code>hitCountChoices.bySkill</code> entry (data/rules/rollbacks.ts:66-85).",
  "facts": [
    [
      "Lines",
      "312"
    ],
    [
      "Hit count range",
      "2 to 10; Zeal 2 to 5, starting at 5"
    ]
  ],
  "warn": "The hit count and the shield reset when the skill changes, through <code>key={build.skill}</code> (attack-view.tsx:308; .claude/rules/ias-ui.md:16). Both stay outside <code>Build</code> and the share link (.claude/rules/ias-animation.md:35).",
  "see": [
    "e-animation",
    "av-sprites",
    "av-clock",
    "av-scene",
    "av-labels",
    "av-shield"
  ],
  "src": "apps/ias/src/ui/screens/attack-view.tsx:1-312"
}, {"color": "--z-attack-view", "couples": ["av-scene", "av-shield", "ui-tables"]});
MAP.add("attack-view", "av-scene", [1, 2], "Scene and film strip", "screens/attack-scene.tsx\nattack-ticks.ts", {
  "kicker": "ui/screens/attack-scene.tsx:12-116",
  "title": "Scene, counter, thumbnails",
  "lead": "The animation at x2 with a game frame counter and a hit badge, then one thumbnail per game frame, grouped by hit. <code>placeTicks</code> does the grouping.",
  "io": [
    [
      "Receives",
      "<code>Sprites</code>, the timeline's ticks and hits, the clock's index."
    ],
    [
      "Produces",
      "Canvas frames and counters."
    ]
  ],
  "swap": "Only <code>AttackPlayer</code> uses it (attack-view.tsx:32-33,190-198).",
  "extend": "A new marker per tick reads <code>Tick</code> (contracts/animation.ts:113-119).",
  "facts": [
    [
      "Lines",
      "164 in 2 files"
    ],
    [
      "Scene scale",
      "2"
    ]
  ],
  "warn": "<code>placedAt</code> throws when the index has no tick (attack-ticks.ts:40-47).",
  "see": [
    "av-view",
    "av-sprites",
    "av-labels"
  ],
  "src": "apps/ias/src/ui/screens/attack-scene.tsx; attack-ticks.ts"
}, {"color": "--z-attack-view", "couples": ["av-view"]});
MAP.add("attack-view", "av-sprites", [0, 2], "Sprite loader", "components/sprite-player.tsx", {
  "kicker": "ui/components/sprite-player.tsx:111-362",
  "title": "useSprites and SpriteCanvas",
  "lead": "<code>useSprites</code> fetches each mode's <code>manifest.json</code> and the sheets the clip draws under <code>game/sprites/</code>, one folder per token, mode and weapon class (sprite-player.tsx:42-44). It crops to the drawn pixels and caches each animation per page. <code>SpriteCanvas</code> stacks one sprite frame's layers in manifest order.",
  "io": [
    [
      "Receives",
      "A <code>Timeline</code>: its <code>Clip</code> and modes."
    ],
    [
      "Produces",
      "<code>Sprites</code>: <code>loading</code>, <code>missing</code>, or <code>ready</code> with a box and one animation per mode."
    ]
  ],
  "swap": "Keep <code>SpriteManifest</code> (contracts/animation.ts:38-50), which <code>assets:extract</code> writes. A renderer that reads the same <code>Timeline</code> can replace it (.claude/rules/ias-animation.md:29).",
  "extend": "New sheets come from <code>bun run assets:extract</code>. <code>offeredAnimations()</code> lists them, so a new skill needs no list edit (.claude/rules/ias-data.md:16).",
  "facts": [
    [
      "Lines",
      "362"
    ],
    [
      "Committed sprite files",
      "2539, of which 186 manifests (git ls-files)"
    ],
    [
      "Crop margin",
      "4 px"
    ]
  ],
  "warn": "A weapon or shield without its sheet gives <code>missing</code>, shown as Animation files are missing (sprite-player.tsx:88-109; .claude/rules/ias-ui.md:16). URLs are relative because the site lives under <code>/d2-lab/</code> (.claude/rules/ias-ui.md:17).",
  "see": [
    "av-view",
    "av-scene",
    "c-animation"
  ],
  "src": "apps/ias/src/ui/components/sprite-player.tsx:1-362"
}, {"color": "--z-attack-view", "couples": ["c-animation", "av-scene"]});
MAP.add("attack-view", "av-clock", [0, 0], "Game clock", "hooks/use-game-clock.ts", {
  "kicker": "ui/hooks/use-game-clock.ts:6-70",
  "title": "useGameClock",
  "lead": "Counts game frames with <code>requestAnimationFrame</code>: real speed (25 per second), slow (4 times slower) or step. Starts slow, or in step mode when the viewer prefers reduced motion.",
  "io": [
    [
      "Receives",
      "Nothing; reads <code>gameFramesPerSecond</code> (line 3)."
    ],
    [
      "Produces",
      "<code>GameClock</code>: <code>tick</code>, <code>playback</code>, <code>setPlayback</code>, <code>step</code>."
    ]
  ],
  "swap": "Only <code>AttackPlayer</code> uses it (attack-view.tsx:179).",
  "extend": "A playback mode: a <code>Playback</code> member, its rate (use-game-clock.ts:7-14) and its label in <code>playbackLabels</code> (attack-labels.ts:43-47).",
  "facts": [
    [
      "Lines",
      "70"
    ],
    [
      "Slow factor",
      "4"
    ]
  ],
  "see": [
    "av-view",
    "d-speed"
  ],
  "src": "apps/ias/src/ui/hooks/use-game-clock.ts:1-70"
}, {"color": "--z-attack-view", "couples": ["av-labels", "av-view"]});
MAP.add("attack-view", "av-labels", [1, 1], "Attack texts", "screens/attack-labels.ts", {
  "kicker": "ui/screens/attack-labels.ts:1-310",
  "title": "Sentences and counters",
  "lead": "The sentences, counters and control labels of the attack view: attack and sequence sentences, the comparison with the next breakpoint, the hit count label and hint, and the unavailable text.",
  "io": [
    [
      "Receives",
      "Frames, hit frames, hits, the table variable, and the <code>tableVariables</code> labels (line 5)."
    ],
    [
      "Produces",
      "<code>Phrase</code>s and strings."
    ]
  ],
  "swap": "<code>attack-view.tsx</code> and <code>attack-scene.tsx</code> import it (attack-view.tsx:18-31; attack-scene.tsx:4-9).",
  "extend": "A skill that lands no hit: a <code>Move</code> in <code>moves</code> (attack-labels.ts:63-65). A hit count hint: <code>hitCountHints</code> (attack-labels.ts:221-223).",
  "facts": [
    [
      "Lines",
      "310"
    ]
  ],
  "warn": "Sprite frames never reach UI text (.claude/rules/ias-animation.md:34). <code>moves</code> and <code>skillsWithoutHit</code> (data/rules/sprites.ts:104-107) both name Dodge by hand.",
  "see": [
    "av-view",
    "av-scene",
    "ui-text"
  ],
  "src": "apps/ias/src/ui/screens/attack-labels.ts:1-310"
}, {"color": "--z-attack-view", "couples": ["av-view", "av-scene"]});
MAP.add("attack-view", "av-shield", [1, 0], "Shield controls", "screens/shield-controls.tsx", {
  "kicker": "ui/screens/shield-controls.tsx:13-50",
  "title": "Shield select and Holy Shield",
  "lead": "A shield select and a Holy Shield checkbox, shown for a skill in <code>shieldSkills</code> (Smite).",
  "io": [
    [
      "Receives",
      "The current <code>Shield</code> and <code>onShieldChange</code>."
    ],
    [
      "Produces",
      "A new <code>Shield</code> value."
    ]
  ],
  "swap": "Only <code>AttackSection</code> renders it (attack-view.tsx:273-275).",
  "extend": "A shield graphic: a <code>shieldGraphics</code> entry (data/rules/sprites.ts:125-144). <code>assets:extract</code> then writes its sheet (.claude/rules/ias-data.md:16).",
  "facts": [
    [
      "Lines",
      "50"
    ],
    [
      "Shield graphics",
      "9; starts on Heraldic Shield (pa3)"
    ]
  ],
  "warn": "The shield is view state, kept outside <code>Build</code> and the share link (.claude/rules/ias-animation.md:35).",
  "see": [
    "av-view",
    "d-sprites"
  ],
  "src": "apps/ias/src/ui/screens/shield-controls.tsx:1-50"
}, {"color": "--z-attack-view", "couples": ["av-view"]});

// ---------- App shell ----------
MAP.add("app-shell", "app-main", [1, 0], "main.tsx", "src/main.tsx", {
  "kicker": "src/main.tsx:1-31",
  "title": "Client entry",
  "lead": "Mounts <code>Calculator</code> with <code>location.search</code>. With no query it hydrates the prerendered page; otherwise it renders fresh and removes <code>share-link-pending</code>.",
  "io": [
    [
      "Receives",
      "<code>#root</code> and <code>location.search</code>."
    ],
    [
      "Produces",
      "The running React app."
    ]
  ],
  "swap": "<code>index.html</code> loads it (index.html:32).",
  "extend": "No source describes an extension.",
  "facts": [
    [
      "Lines",
      "31"
    ]
  ],
  "warn": "A share link keeps the prerendered default build hidden until React renders the link's build (main.tsx:19-31; build.ts:34-35; braise.css:122-125).",
  "see": [
    "app-build",
    "app-html",
    "ui-state"
  ],
  "src": "apps/ias/src/main.tsx:1-31"
}, {"color": "--z-app-shell", "couples": ["app-build"]});
MAP.add("app-shell", "app-build", [1, 1], "Production build", "build.ts\npublic-files-plugin.ts", {
  "kicker": "apps/ias/build.ts:1-83",
  "title": "Bundle, prerender, CSP",
  "lead": "Bundles <code>index.html</code> with Tailwind and the public-files plugin. Prerenders <code>Calculator</code> with an empty search into <code>#root</code>, adds a CSP meta and the share-link script, then copies <code>public/</code> into <code>dist/</code>.",
  "io": [
    [
      "Receives",
      "<code>index.html</code>, <code>src/</code>, <code>public/</code>."
    ],
    [
      "Produces",
      "<code>apps/ias/dist/</code>."
    ]
  ],
  "swap": "CI deploys <code>dist/</code> (AGENTS.md:43). <code>bun run e2e</code> builds, then checks it (package.json:13).",
  "extend": "A new style attribute in the prerendered markup gets its hash at build time (build.ts:37-42; .claude/rules/ias-ui.md:18).",
  "facts": [
    [
      "Lines",
      "83, plus 19 in the plugin"
    ],
    [
      "CSP directives",
      "6"
    ]
  ],
  "warn": "The CSP allows no inline script or style except the ones it hashes; anything else shows as a console error in <code>bun run e2e</code> (.claude/rules/ias-ui.md:18). A component must render without <code>window</code>, <code>document</code> or <code>location</code> (.claude/rules/ias-ui.md:17).",
  "see": [
    "app-main",
    "app-html",
    "ui-kit"
  ],
  "src": "apps/ias/build.ts:1-83; apps/ias/public-files-plugin.ts:1-19"
}, {"color": "--z-app-shell", "couples": ["app-main", "app-html", "dist-check", "smoke", "layout", "ci-check"]});
MAP.add("app-shell", "app-dev", [0, 1], "Dev server", "dev.ts", {
  "kicker": "apps/ias/dev.ts:114-155",
  "title": "Bun dev server",
  "lead": "Serves <code>/</code> (index.html), <code>/theme</code> (theme.html) and <code>/__dev</code> (status) with HMR, and any other path from <code>public/</code>. Reuses a running server, or restarts it when the fingerprint changed.",
  "io": [
    [
      "Receives",
      "Port 3000, the list of <code>src/**</code> paths and 7 config files (dev.ts:20-41)."
    ],
    [
      "Produces",
      "A dev server at http://localhost:3000."
    ]
  ],
  "swap": "<code>bun run dev</code> runs it (package.json:9).",
  "extend": "A dev page: a route in <code>routes</code> (dev.ts:118-122) and its HTML import (dev.ts:1-2).",
  "facts": [
    [
      "Lines",
      "155"
    ],
    [
      "Routes",
      "3, plus public files"
    ],
    [
      "Restart inputs",
      "7 files"
    ]
  ],
  "warn": "On a <code>Could not resolve</code> for a new file, rerun <code>bun run dev</code> (AGENTS.md:27). The fingerprint hashes source paths, not their contents; HMR handles edits (dev.ts:36-41,146-147).",
  "see": [
    "app-html",
    "ui-kit"
  ],
  "src": "apps/ias/dev.ts:1-155"
}, {"color": "--z-app-shell"});
MAP.add("app-shell", "app-html", [0, 0], "HTML entries", "index.html\ntheme.html", {
  "kicker": "apps/ias/index.html:1-34",
  "title": "Page and theme preview entries",
  "lead": "<code>index.html</code> carries meta, Open Graph tags, icons, <code>braise.css</code> and <code>src/main.tsx</code>. <code>theme.html</code> carries <code>braise.css</code> and <code>src/ui/theme-preview.tsx</code>.",
  "io": [
    [
      "Receives",
      "Nothing."
    ],
    [
      "Produces",
      "Entry points for the bundler and the dev server."
    ]
  ],
  "swap": "<code>build.ts</code> bundles and rewrites <code>index.html</code> (build.ts:19-25,60-79). <code>dev.ts</code> imports both files (dev.ts:1-2).",
  "extend": "Page metadata goes in index.html:5-27.",
  "facts": [
    [
      "Lines",
      "34 + 13"
    ]
  ],
  "warn": "<code>build.ts</code> inserts the CSP after <code>meta[charset]</code> and the prerender into <code>#root</code>, so both must stay (build.ts:63-76).",
  "see": [
    "app-build",
    "app-dev",
    "app-main"
  ],
  "src": "apps/ias/index.html:1-34; apps/ias/theme.html:1-13"
}, {"color": "--z-app-shell", "couples": ["app-build"]});

// ---------- Golden oracle ----------
MAP.add("golden", "original-checkout", [0, 0], "Original checkout", "ias-golden/upstream.ts\nclone @bcc112d + serve", {
  "kicker": "tools/ias-golden/upstream.ts:59-84",
  "title": "Checkout and server of Warren's calculator",
  "lead": "Fetches Warren1001/IAS_Calculator at one pinned SHA into a temp dir and checks HEAD. Serves it on 127.0.0.1 for one run, then deletes it.",
  "io": [
    [
      "Receives",
      "UPSTREAM_REPOSITORY and UPSTREAM_SHA (upstream.ts:5-7), plus network access to GitHub"
    ],
    [
      "Produces",
      "OriginalSite {indexUrl}, valid while the callback runs (upstream.ts:9-11, 63-84)"
    ]
  ],
  "swap": "dump-original.ts and generate.ts both call withOriginalSite. Moving to another commit of Warren's calculator means a new fixture, new goldens and new calculator.js citations in data/rules (.claude/rules/ias-data.md:11).",
  "extend": "It has no extension point: one SHA constant.",
  "facts": [
    [
      "SHA",
      "bcc112d4b6d41a646f6abc6751daf78752157e40 (upstream.ts:7)"
    ],
    [
      "Original version",
      "v1.2.4, D2R 3.3 (goldens/README.md:3)"
    ],
    [
      "Fetch",
      "git fetch --depth 1 (upstream.ts:36)"
    ]
  ],
  "warn": "It throws when HEAD is not the pinned SHA (upstream.ts:41-43), so a deleted upstream commit stops both generators.",
  "see": [
    "original-dump",
    "golden-gen"
  ],
  "src": "tools/ias-golden/upstream.ts, README.md:12-14"
}, {"color": "--z-golden", "couples": ["original-dump", "golden-gen"]});
MAP.add("golden", "original-dump", [1, 0], "Original constants dump", "bun run original:dump\ndump-original.ts", {
  "kicker": "tools/ias-golden/dump-original.ts:1-46",
  "title": "original:dump to original-constants.json",
  "lead": "Opens the served copy of Warren's calculator in Chromium, imports constants.js in the page and serializes its weaponsMap and wt.*.frameData.",
  "io": [
    [
      "Receives",
      "The OriginalSite and constants.js@bcc112d (tools/ias-golden/original-constants.ts:37-67)"
    ],
    [
      "Produces",
      "apps/ias/test/fixtures/original-constants.json with upstreamSha, weapons and frames (dump-original.ts:13, 29-37)"
    ]
  ],
  "swap": "data.test.ts is its only reader in the app (apps/ias/test/data.test.ts:8). A new source must keep the {upstreamSha, weapons, frames} shape.",
  "extend": "Add a field to OriginalConstants and read it in readOriginalConstants (original-constants.ts:13-17, 37-67).",
  "facts": [
    [
      "Weapons",
      "292 (measured)"
    ],
    [
      "Frames",
      "10 weapon types, 85 entries (measured)"
    ],
    [
      "Fixture",
      "1,864 lines (wc)"
    ],
    [
      "Reproducible",
      "a rerun gives the same sha256"
    ]
  ],
  "warn": "Never regenerate it in CI (AGENTS.md:25).",
  "see": [
    "original-checkout",
    "unit-tests"
  ],
  "src": "tools/ias-golden/dump-original.ts, tools/ias-golden/original-constants.ts"
}, {"color": "--z-golden", "couples": ["original-checkout", "unit-tests"]});
MAP.add("golden", "golden-gen", [0, 1], "Golden generator", "bun run golden:generate\ngenerate.ts + page pool", {
  "kicker": "tools/ias-golden/generate.ts:229-274",
  "title": "golden:generate to test/goldens/",
  "lead": "Walks the original form along the canonical path in a pool of Chromium pages. Then plans variant, bounds and reference cases, runs them and writes the case files.",
  "io": [
    [
      "Receives",
      "The OriginalSite, plus the original form's baseline and constants (generate.ts:237)"
    ],
    [
      "Produces",
      "goldens/cases/<family>/<character>.jsonl, forms.json and meta.json (tools/ias-golden/write-goldens.ts:121-165)"
    ]
  ],
  "swap": "golden-suite.ts, original.ts and form-snapshots.ts read its line format and the types in original-form.ts (apps/ias/test/golden-suite.ts:5-10, apps/ias/test/original.ts:14-18).",
  "extend": "A named build goes in REFERENCE_BUILDS (generate.ts:19-34). A new case kind goes in CaseKind (cases.ts:42) and planFilledCases (generate.ts:169-205).",
  "facts": [
    [
      "Case kinds",
      "structural, variant, bounds, reference (cases.ts:42)"
    ],
    [
      "Page pool",
      "CPU cores minus 2 (generate.ts:235)"
    ],
    [
      "console.log",
      "neutralized in every page (page-pool.ts:80-81)"
    ],
    [
      "Run time",
      "538 s (measured)"
    ]
  ],
  "warn": "It deletes goldens/cases/ before writing (write-goldens.ts:108). GAME_VERSION is a hard-coded 3.3.93847 (write-goldens.ts:10), not read from the game data. Never run it in CI (AGENTS.md:25).",
  "see": [
    "original-checkout",
    "goldens"
  ],
  "src": "tools/ias-golden/generate.ts, cases.ts, page-pool.ts, write-goldens.ts"
}, {"color": "--z-golden", "couples": ["original-checkout", "goldens", "calc-goldens", "form-snapshots"]});
MAP.add("golden", "goldens", [0, 2], "Golden cases", "apps/ias/test/goldens/\n23 jsonl + forms + meta", {
  "kicker": "apps/ias/test/goldens/README.md:1-35",
  "title": "Goldens of Warren's calculator",
  "lead": "Committed records of Warren's calculator. Each case holds the input controls, a form reference, and the rendered tables.",
  "io": [
    [
      "Receives",
      "Writes from golden:generate only"
    ],
    [
      "Produces",
      "Case lines {id, input, form, output}, read through goldenFiles(family) (apps/ias/test/golden-suite.ts:100-106)"
    ]
  ],
  "swap": "Every goldens.*.test.ts reads them through golden-suite.ts.",
  "extend": "Regenerate them, never edit them (goldens/README.md:3).",
  "facts": [
    [
      "Cases",
      "45,990: structural 24,370, variant 18,398, bounds 3,220, reference 2 (meta.json:6-12)"
    ],
    [
      "Families",
      "single 9,799, dual 17,913, forms-mercs 18,278 (wc -l)"
    ],
    [
      "Distinct forms",
      "303 (measured)"
    ],
    [
      "Size",
      "42,553,488 B (measured)"
    ]
  ],
  "warn": "A case that is both dual and forms-mercs goes to dual (goldens/README.md:35).",
  "see": [
    "golden-gen",
    "calc-goldens",
    "form-snapshots",
    "golden-checks"
  ],
  "src": "apps/ias/test/goldens/README.md, apps/ias/test/goldens/meta.json"
}, {"color": "--z-golden", "couples": ["golden-gen", "calc-goldens", "form-snapshots", "golden-checks"]});
MAP.add("golden", "calc-goldens", [1, 2], "Calculation goldens", "golden-suite.ts \u00b7 original.ts\ngoldens.{single,dual,forms-mercs}", {
  "kicker": "apps/ias/test/golden-suite.ts:108-119",
  "title": "Calculation golden suites",
  "lead": "One test per golden case. Maps the original input to a Build and asserts that computeTables renders exactly the original output.",
  "io": [
    [
      "Receives",
      "The golden cases of one family, plus fromOriginalInput and originalOutput (apps/ias/test/original.ts:149, 184)"
    ],
    [
      "Produces",
      "A pass or a fail per case id, grouped by character file (golden-suite.ts:109-119)"
    ]
  ],
  "swap": "original.ts holds the constants.js value maps (original.ts:20-56) and calls computeTables and tableHeader (original.ts:9-18). A change in the engine's API changes original.ts only.",
  "extend": "No output deviation exists yet: a deliberate change of output needs that mechanism designed first (AGENTS.md:56; .claude/rules/ias-engine.md:11).",
  "facts": [
    [
      "Test files",
      "3 files of 3 lines each (wc)"
    ],
    [
      "Cases",
      "45,990"
    ]
  ],
  "warn": "The pre-commit hook skips goldens.* files. Run the full bun test before committing a change to the engine or the data (.claude/rules/ias-engine.md:11).",
  "see": [
    "goldens",
    "deviations"
  ],
  "src": "apps/ias/test/golden-suite.ts, apps/ias/test/original.ts, apps/ias/test/goldens.single.test.ts"
}, {"color": "--z-golden", "couples": ["goldens", "e-tables"]});
MAP.add("golden", "deviations", [1, 3], "Golden deviations", "test/golden-deviations.ts\nform \u00b7 floor \u00b7 ceiling", {
  "kicker": "apps/ias/test/golden-deviations.ts:84-328",
  "title": "Differences from the game the app does not reproduce",
  "lead": "Lists each original form option, field, floor or ceiling the app changes on purpose. Each entry has a case predicate and a source.",
  "io": [
    [
      "Receives",
      "A Build (golden-deviations.ts:32-38, 279, 315)"
    ],
    [
      "Produces",
      "The RemovedOptions, AddedOptions, Floors and Ceilings the snapshot test expects (:173-194, 289, 326)"
    ]
  ],
  "swap": "goldens.form-snapshots.test.ts consumes it (goldens.form-snapshots.test.ts:11-20). Each floor or ceiling mirrors a rule in data/rules/floors.ts (AGENTS.md:52-53).",
  "extend": "An option or field the game forbids goes in goldenDeviations, a minimum in floorDeviations, a maximum in ceilingDeviations (AGENTS.md:52-55). A field the original form lacks needs a new AddedOptions member (AGENTS.md:51).",
  "facts": [
    [
      "goldenDeviations",
      "11 (golden-deviations.ts:86-161)"
    ],
    [
      "floorDeviations",
      "7 (:215-260)"
    ],
    [
      "ceilingDeviations",
      "1, hustle-burst-of-speed (:304)"
    ]
  ],
  "warn": "Write a deviation in terms of the case, never with the engine function it checks, or the test checks nothing (.claude/rules/ias-tests.md:13).",
  "see": [
    "form-snapshots",
    "calc-goldens"
  ],
  "src": "apps/ias/test/golden-deviations.ts, .claude/rules/ias-tests.md:13"
}, {"color": "--z-golden", "couples": ["form-snapshots", "d-form"]});
MAP.add("golden", "form-snapshots", [0, 3], "Form snapshots", "goldens.form-snapshots.test.ts\n+ form-snapshots.ts", {
  "kicker": "apps/ias/test/goldens.form-snapshots.test.ts:196-258",
  "title": "Form, normalize and output vs original",
  "lead": "For each kept case, compares the app's InputSpec with the original form minus the deviations. Checks normalize with noise in the hidden fields. Compares the output unless a floor, a ceiling or a reset moved a value.",
  "io": [
    [
      "Receives",
      "The golden cases, forms.json (apps/ias/test/form-snapshots.ts:85) and the deviations"
    ],
    [
      "Produces",
      "Per-case asserts and pinned counts: skipped, raised per floor, lowered per ceiling, reset per field (goldens.form-snapshots.test.ts:220-258)"
    ]
  ],
  "swap": "It calls availableInputs and normalize directly (goldens.form-snapshots.test.ts:7-8, 200-210).",
  "extend": "When a change moves a pinned number, read the diff, update the number and explain it in the commit message (.claude/rules/ias-tests.md:15).",
  "facts": [
    [
      "Skipped cases",
      "19,166 (:223)"
    ],
    [
      "Raised by floors",
      "wolfhowl-werewolf 1,927, frenzy 1,749, druid-werewolf 847, passion-ias 360, chaos-ias 68, beast-ias 50, beast-fanaticism 47 (:238-248)"
    ],
    [
      "Lowered by ceiling",
      "hustle-burst-of-speed 9,172 (:250-254)"
    ],
    [
      "Reset",
      "purge 8 (:256-258)"
    ],
    [
      "CI time",
      "about 20 s"
    ]
  ],
  "warn": "It cannot yet express a field the original form lacks (AGENTS.md:51).",
  "see": [
    "deviations",
    "goldens"
  ],
  "src": "apps/ias/test/goldens.form-snapshots.test.ts, apps/ias/test/form-snapshots.ts, .claude/rules/ias-tests.md:14-15"
}, {"color": "--z-golden", "couples": ["deviations", "goldens", "e-form"]});

// ---------- Tests ----------
MAP.add("tests", "unit-tests", [0, 0], "Unit and data tests", "apps/ias/test/*.test.ts\n24 files + buildOf", {
  "kicker": "apps/ias/test/builds.ts:26",
  "title": "Unit and data tests",
  "lead": "Focused tests of the engine, share link, UI state and labels. Builds come from buildOf(changes), where every other field keeps its original default. data.test.ts checks the generated weapons and frames against the original fixture.",
  "io": [
    [
      "Receives",
      "Builds from buildOf (builds.ts:26), plus gameData and original-constants.json (data.test.ts:5, 8)"
    ],
    [
      "Produces",
      "Pass or fail under bun test and the pre-commit hook"
    ]
  ],
  "swap": "They import app modules through @/ paths. No oxlint layer rule covers test/ (oxlint.config.ts:61-65), so tests can reach any layer.",
  "extend": "Add a <name>.test.ts in apps/ias/test/. A test that reads every golden case is named goldens.<name>.test.ts (.claude/rules/ias-tests.md:12).",
  "facts": [
    [
      "Files",
      "25 non-golden test files besides sprites.test.ts"
    ],
    [
      "Helpers",
      "builds, original, golden-suite, golden-deviations, form-snapshots, share-link"
    ],
    [
      "data.test.ts",
      "first case: the 291 original weapon bases plus unarmed"
    ]
  ],
  "warn": "share-link.test.ts pins the order of shareParams, so a new parameter moves the pinned list (.claude/rules/ias-share-link.md:9).",
  "see": [
    "original-dump",
    "golden-checks"
  ],
  "src": "apps/ias/test/, .claude/rules/ias-tests.md:10"
}, {"color": "--z-tests", "couples": ["original-dump"]});
MAP.add("tests", "sprite-test", [2, 0], "Sprite completeness", "test/sprites.test.ts\nmanifests vs offered", {
  "kicker": "apps/ias/test/sprites.test.ts:1-86",
  "title": "Sprite files vs offered animations",
  "lead": "Runs offeredAnimations() and checks each result. Every offered animation needs a manifest in public/game/sprites/, every sheet a manifest names must exist, and every held weapon or shield needs its sheet.",
  "io": [
    [
      "Receives",
      "offeredAnimations (sprites.test.ts:6), public/game/sprites/, and isSpriteManifest from the UI (sprites.test.ts:4)"
    ],
    [
      "Produces",
      "Failures such as 'pa/a11hs: no file hd-lit.webp'"
    ]
  ],
  "swap": "It is bound to the sprite pipeline's OfferedAnimation shape and folder layout.",
  "extend": "Run it after a change to the extraction or to what the engine animates (.claude/rules/ias-tests.md:17).",
  "facts": [
    [
      "Expected tokens",
      "13 (sprites.test.ts:52-56)"
    ],
    [
      "Dual-wield classes",
      "ba1ss ba1js ba1jt ba1st aiht2 (:58-69)"
    ],
    [
      "Smite shields",
      "10 graphics (:71-80)"
    ]
  ],
  "warn": "An engine change that offers a new animation fails here until assets:extract runs on a machine with the game.",
  "see": [
    "sprite-sheets",
    "game-assets"
  ],
  "src": "apps/ias/test/sprites.test.ts"
}, {"color": "--z-tests", "couples": ["sprite-sheets", "game-assets"]});
MAP.add("tests", "golden-checks", [1, 0], "Golden-wide checks", "goldens.animation\ngoldens.share-link", {
  "kicker": "apps/ias/test/goldens.share-link.test.ts:24-37",
  "title": "Animation and share link over every golden",
  "lead": "goldens.animation checks that each golden row's timeline lasts as long as the row and lands its hits in order. goldens.share-link checks that serialize then parse gives back normalize(build), at the case's current value and at mid-range.",
  "io": [
    [
      "Receives",
      "Golden cases through goldenFiles and fromOriginalInput"
    ],
    [
      "Produces",
      "Per-case asserts"
    ]
  ],
  "swap": "They call attackTimeline, computeTables and locate (goldens.animation.test.ts:9-11), and parseShareLink and serializeShareLink (goldens.share-link.test.ts:6-7).",
  "extend": "A change to the speed steps, rollbackHits or a sequence must keep goldens.animation green (.claude/rules/ias-animation.md:33).",
  "facts": [
    [
      "Animation rows",
      "over 500,000 (.claude/rules/ias-animation.md:33)"
    ],
    [
      "Share-link time",
      "about 50 s in CI"
    ]
  ],
  "see": [
    "goldens",
    "calc-goldens"
  ],
  "src": "apps/ias/test/goldens.animation.test.ts, apps/ias/test/goldens.share-link.test.ts"
}, {"color": "--z-tests", "couples": ["goldens", "e-animation", "sl-parse"]});
MAP.add("tests", "dist-check", [0, 1], "dist file check", "e2e/dist.e2e.ts\nbudgets \u00b7 no map \u00b7 CSP", {
  "kicker": "apps/ias/e2e/dist.e2e.ts:26-53",
  "title": "Built files check",
  "lead": "Reads apps/ias/dist/ after the build. Fails on a budget overrun, a sourcemap, a missing CSP meta tag or an empty #root.",
  "io": [
    [
      "Receives",
      "apps/ias/dist/ from bun run build (package.json:13)"
    ],
    [
      "Produces",
      "'dist check passed' with the sizes, or an error listing the problems (dist.e2e.ts:51-57)"
    ]
  ],
  "swap": "It is bound to build.ts output: the CSP meta and the prerendered #root (apps/ias/build.ts:60-79).",
  "extend": "To exceed a budget on purpose, raise it in dist.e2e.ts and say why in the commit (.claude/rules/ias-tests.md:16).",
  "facts": [
    [
      "JS gzip budget",
      "228,000 B (dist.e2e.ts:28)"
    ],
    [
      "CSS gzip budget",
      "16,000 B (:29)"
    ],
    [
      "Total budget",
      "8,300,000 B (:30-34)"
    ],
    [
      "JS at the first deploy",
      "710,067 B, 213,836 B gzip"
    ]
  ],
  "warn": "The total budget includes the committed game assets (6,815,776 B measured), so a larger extraction can fail it.",
  "see": [
    "app-build",
    "game-assets"
  ],
  "src": "apps/ias/e2e/dist.e2e.ts"
}, {"color": "--z-tests", "couples": ["app-build"]});
MAP.add("tests", "smoke", [1, 1], "Smoke test", "e2e/smoke.e2e.ts + site.ts\nlocal dist/ or SMOKE_URL", {
  "kicker": "apps/ias/e2e/smoke.e2e.ts:145-232",
  "title": "Browser smoke test",
  "lead": "Runs 5 scenarios in Chromium: pick the Smite build in the UI, open it from a link, open an invalid link, copy a link, watch the attack. Fails on any console error, page error or HTTP status of 400 or more.",
  "io": [
    [
      "Receives",
      "dist/ served under /d2-lab/, or the page at SMOKE_URL (site.ts:11, 40-44)"
    ],
    [
      "Produces",
      "'smoke test passed' or the list of problems (smoke.e2e.ts:226-232)"
    ]
  ],
  "swap": "It depends on the UI's accessible names (radio Paladin, combobox Weapon, label Your IAS) and on the expected tile text (smoke.e2e.ts:16-19, 69-76).",
  "extend": "Add an entry to scenarios (smoke.e2e.ts:145-157).",
  "facts": [
    [
      "Scenarios",
      "5 (smoke.e2e.ts:145-157)"
    ],
    [
      "Expected Now tile",
      "8 frames, 3.13 attacks per second at 20 IAS (:17)"
    ],
    [
      "Wait timeout",
      "10 s (:14)"
    ],
    [
      "Runs in",
      "bun run e2e, and CI verify on the live site (ci.yml:110-112)"
    ]
  ],
  "warn": "A mismatch between prerender and hydration fails it with React error #418.",
  "see": [
    "layout",
    "ci-verify",
    "app-build"
  ],
  "src": "apps/ias/e2e/smoke.e2e.ts, apps/ias/e2e/site.ts"
}, {"color": "--z-tests", "couples": ["app-build", "ci-verify"]});
MAP.add("tests", "layout", [2, 1], "Layout and a11y test", "e2e/layout.e2e.ts\n+ layout-checks.ts, axe", {
  "kicker": "apps/ias/e2e/layout.e2e.ts:16-90",
  "title": "Layout and accessibility test",
  "lead": "Opens 9 views at 4 widths. Fails on any axe-core violation or layout problem: sideways scroll, an element out of its panel, text out of its box, text within 2 px of a border, or text over text.",
  "io": [
    [
      "Receives",
      "dist/ through site.ts, and the views list (layout.e2e.ts:43-90)"
    ],
    [
      "Produces",
      "'layout test passed' or the problems. HEADED=1 outlines each fault in red (layout.e2e.ts:5, 21)"
    ]
  ],
  "swap": "findLayoutProblems runs in the page as one self-contained function (apps/ias/e2e/layout-checks.ts:1-15).",
  "extend": "A build whose content runs wider, or a new popup or panel, joins views. A popup that hides the page narrows its axe run (.claude/rules/ias-tests.md:16).",
  "facts": [
    [
      "Widths",
      "390, 768, 1024, 1440 px (layout.e2e.ts:16)"
    ],
    [
      "Views",
      "9 (:43-90)"
    ],
    [
      "Touch threshold",
      "2 px (:19)"
    ],
    [
      "axe",
      "@axe-core/playwright 4.13.0 (package.json:21)"
    ]
  ],
  "warn": "It never runs on the live site: CI verify runs smoke and Lighthouse only (ci.yml:110-115). AGENTS.md:16 and :77 do not mention it.",
  "see": [
    "smoke",
    "lint-format"
  ],
  "src": "apps/ias/e2e/layout.e2e.ts, apps/ias/e2e/layout-checks.ts"
}, {"color": "--z-tests", "couples": ["app-build", "ui-layout"]});
MAP.add("tests", "lighthouse", [3, 1], "Lighthouse audit", "e2e/lighthouse.e2e.ts\nlive site, mobile", {
  "kicker": "apps/ias/e2e/lighthouse.e2e.ts:12-87",
  "title": "Lighthouse floors",
  "lead": "Runs Lighthouse 13.5.0 through npx with Playwright's Chromium on SMOKE_URL. Fails when a category scores under its floor.",
  "io": [
    [
      "Receives",
      "SMOKE_URL, required (:22-26)"
    ],
    [
      "Produces",
      "lighthouse.json in RUNNER_TEMP and one score line (:28, 83)"
    ]
  ],
  "swap": "It is a standalone script, called only by CI verify (ci.yml:113-115).",
  "extend": "Change a floor (:15-20) or the version (:12).",
  "facts": [
    [
      "Floors",
      "performance 0.7, accessibility 0.95, best-practices 0.95, seo 0.95 (:15-20)"
    ],
    [
      "First CI run",
      "0.86 / 1 / 1 / 1"
    ]
  ],
  "warn": "npx fetches Lighthouse at run time, outside the lockfile (:2-4).",
  "see": [
    "ci-verify"
  ],
  "src": "apps/ias/e2e/lighthouse.e2e.ts"
}, {"color": "--z-tests", "couples": ["ci-verify"]});

// ---------- CI and deploy ----------
MAP.add("ci", "ci-check", [0, 0], "CI check job", "ci.yml jobs.check\nPR, main, dispatch", {
  "kicker": ".github/workflows/ci.yml:19-42",
  "title": "check job",
  "lead": "Runs on every push to main, every pull request and every manual dispatch: bun ci, bun run check, bun test, Playwright Chromium install and bun run e2e. Then uploads apps/ias/dist/ as the artifact named site.",
  "io": [
    [
      "Receives",
      "A checkout without persisted credentials (ci.yml:26-28)"
    ],
    [
      "Produces",
      "The artifact site (apps/ias/dist/), kept 7 days (ci.yml:37-42)"
    ]
  ],
  "swap": "deploy and verify download the artifact named site (ci.yml:55-58, 92-95).",
  "extend": "Add a step before the upload. The e2e step builds dist/ (package.json:13).",
  "facts": [
    [
      "Timeout",
      "30 min (ci.yml:22)"
    ],
    [
      "Runner",
      "ubuntu-24.04 (:21)"
    ],
    [
      "Concurrency",
      "per ref, cancel in progress (:11-13)"
    ]
  ],
  "warn": "CI never regenerates data, fixture or goldens, and it has no D2R install (AGENTS.md:25).",
  "see": [
    "ci-deploy",
    "app-build",
    "dist-check"
  ],
  "src": ".github/workflows/ci.yml:1-42"
}, {"color": "--z-ci", "couples": ["ci-deploy", "ci-verify", "app-build"]});
MAP.add("ci", "ci-deploy", [1, 0], "Deploy job", "ci.yml jobs.deploy\nactions/deploy-pages", {
  "kicker": ".github/workflows/ci.yml jobs.deploy",
  "title": "deploy job",
  "lead": "Runs after check, on main and never for a pull request. Publishes to GitHub Pages the artifact that check uploaded with <code>actions/upload-pages-artifact</code>, through <code>actions/deploy-pages</code> and the <code>github-pages</code> environment.",
  "io": [
    ["Receives", "The Pages artifact of the check job: the tested <code>apps/ias/dist/</code>."],
    ["Produces", "A Pages deployment, and its URL as the environment URL."]
  ],
  "swap": "Another host replaces this job and the upload step of check. The verify job compares the live <code>index.html</code> with the built one, whatever the host.",
  "extend": "It has no extension point.",
  "facts": [
    ["Concurrency", "group deploy, no cancel"],
    ["Timeout", "10 min"],
    ["Permissions", "pages: write, id-token: write"]
  ],
  "warn": "The repo's Pages source must be GitHub Actions (Settings, Pages), or the deployment has nowhere to go.",
  "see": ["ci-check", "ci-verify"],
  "src": ".github/workflows/ci.yml; docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages"
}, {"color": "--z-ci", "couples": ["ci-check", "ci-verify"]});
MAP.add("ci", "ci-verify", [1, 1], "Verify job", "ci.yml jobs.verify\nsmoke + Lighthouse live", {
  "kicker": ".github/workflows/ci.yml:78-115",
  "title": "verify job",
  "lead": "Polls the live URL until it serves the same index.html as the artifact. Then runs smoke.e2e.ts and lighthouse.e2e.ts against it.",
  "io": [
    [
      "Receives",
      "The artifact site and SITE_URL https://bengous.github.io/d2-lab/ (ci.yml:15-16)"
    ],
    [
      "Produces",
      "Pass or fail of the live checks"
    ]
  ],
  "swap": "It reaches smoke.e2e.ts and lighthouse.e2e.ts through SMOKE_URL (ci.yml:110-115).",
  "extend": "Add a step with SMOKE_URL set.",
  "facts": [
    [
      "Poll",
      "60 attempts, 10 s apart (ci.yml:98-107)"
    ],
    [
      "Timeout",
      "20 min (:82)"
    ]
  ],
  "warn": "It judges freshness by a byte compare of index.html only (ci.yml:99-100).",
  "see": [
    "smoke",
    "lighthouse"
  ],
  "src": ".github/workflows/ci.yml:78-115"
}, {"color": "--z-ci", "couples": ["smoke", "lighthouse"]});
MAP.add("ci", "lint-format", [0, 2], "Lint and format", "oxlint.config.ts\noxfmt.config.ts \u00b7 oxslop", {
  "kicker": "oxlint.config.ts:1-68",
  "title": "oxlint, oxfmt and oxslop",
  "lead": "bun run check runs oxfmt --check, then oxlint --deny-warnings, type-aware with type checking. Layer overrides forbid upward imports inside apps/ias/src/.",
  "io": [
    [
      "Receives",
      "Every TS file except oxfmt's ignore patterns (oxfmt.config.ts:7)"
    ],
    [
      "Produces",
      "Errors. CI and the pre-commit hook fail on any of them"
    ]
  ],
  "swap": "The layer rule is the only tool that enforces the src layers (AGENTS.md:39).",
  "extend": "A new layer is one layer(name, forbidden) call (oxlint.config.ts:8-25, 61-65). A disable needs a reason after -- (AGENTS.md:71).",
  "facts": [
    [
      "Plugins",
      "eslint, typescript, unicorn, oxc, react, jsx-a11y (:28)"
    ],
    [
      "Categories at error",
      "correctness, suspicious, perf, pedantic (:33-38)"
    ],
    [
      "Limits",
      "complexity 10, max-lines 300, max-lines-per-function 50 (:41-43)"
    ],
    [
      "oxfmt ignores",
      "docs/**, tools/d2r-data/**, apps/ias/public/game/** (oxfmt.config.ts:7)"
    ]
  ],
  "warn": "The layer patterns name only @/ imports inside apps/ias/src (oxlint.config.ts:10, 17). scripts/, test/ and tools/ are not layered, and no rule blocks an import of tools/d2-dcc from src.",
  "see": [
    "pre-commit",
    "d2-dcc"
  ],
  "src": "oxlint.config.ts, oxfmt.config.ts, package.json:11"
}, {"color": "--z-ci", "couples": ["pre-commit", "ci-check"]});
MAP.add("ci", "pre-commit", [1, 2], "Pre-commit hook", "lefthook.yml\nformat \u00b7 lint \u00b7 fast tests", {
  "kicker": "lefthook.yml:1-9",
  "title": "lefthook pre-commit",
  "lead": "Runs oxfmt --check, oxlint --deny-warnings and bun test in parallel. The test job skips e2e and the goldens.* files.",
  "io": [
    [
      "Receives",
      "The working tree at commit time"
    ],
    [
      "Produces",
      "A blocked or allowed commit"
    ]
  ],
  "swap": "It is independent of CI, which reruns check and the full bun test (ci.yml:33-34).",
  "extend": "Add a job under pre-commit.jobs.",
  "facts": [
    [
      "Jobs",
      "3, parallel (lefthook.yml:2-9)"
    ],
    [
      "Skipped tests",
      "apps/ias/e2e/** and apps/ias/test/goldens.*.test.ts (:9)"
    ]
  ],
  "warn": "lefthook is not in the devDependencies of package.json (package.json:20-31), and no doc says how to install it.",
  "see": [
    "lint-format",
    "calc-goldens"
  ],
  "src": "lefthook.yml"
}, {"color": "--z-ci", "couples": ["lint-format"]});
MAP.add("ci", "pins", [0, 1], "Exact pins", "bunfig.toml\ntools/repo.test.ts", {
  "kicker": "tools/repo.test.ts:1-61",
  "title": "Exact dependency pins",
  "lead": "bunfig.toml makes installs exact. repo.test.ts fails when package.json or apps/*/package.json holds a version range.",
  "io": [
    [
      "Receives",
      "package.json and apps/*/package.json (repo.test.ts:7-10)"
    ],
    [
      "Produces",
      "One test per manifest (repo.test.ts:59-61)"
    ]
  ],
  "swap": "It is self-contained and runs under bun test.",
  "extend": "The glob picks up a new workspace under apps/ (repo.test.ts:9).",
  "facts": [
    [
      "Pattern",
      "x.y.z with an optional prerelease (repo.test.ts:14)"
    ],
    [
      "bunfig",
      "[install] exact = true (bunfig.toml:1-2)"
    ],
    [
      "Split",
      "app runtime in apps/ias/package.json, tooling at the root (AGENTS.md:87)"
    ]
  ],
  "warn": "tools/d2-dcc/package.json is not scanned (repo.test.ts:7-10). It declares no dependency today (tools/d2-dcc/package.json:1-6).",
  "see": [
    "ci-check"
  ],
  "src": "tools/repo.test.ts, bunfig.toml"
}, {"color": "--z-ci"});

// ---------- Agent docs ----------
MAP.add("agent-docs", "agents-md", [0, 0], "AGENTS.md index", "AGENTS.md \u00b7 CLAUDE.md\nREADME.md", {
  "kicker": "AGENTS.md:1-87",
  "title": "Root index",
  "lead": "Lists commands, the path of a build through the app, the layers, deploy, common changes as one-line recipes, zone rules and zones. CLAUDE.md only imports it. README.md holds the live URL, the credits, the license and the Blizzard notice.",
  "io": [
    [
      "Receives",
      "An edit whenever a change makes a line stale"
    ],
    [
      "Produces",
      "The first file an agent reads, with links to the rules and docs"
    ]
  ],
  "swap": "CLAUDE.md is the line @AGENTS.md (CLAUDE.md:1).",
  "extend": "A new common change is one bullet under Common changes (AGENTS.md:45-58).",
  "facts": [
    [
      "Commands",
      "11 (AGENTS.md:12-22)"
    ],
    [
      "Common changes",
      "8 recipes (AGENTS.md:47-58)"
    ],
    [
      "README",
      "45 lines: live URL, credits, license, Blizzard notice (README.md:1-45)"
    ]
  ],
  "warn": "AGENTS.md:16 says bun run e2e runs dist and smoke only, and :77 calls e2e a smoke test. package.json:13 also runs layout.e2e.ts, and lighthouse.e2e.ts also lives in e2e/.",
  "see": [
    "context-md",
    "zone-rules"
  ],
  "src": "AGENTS.md, CLAUDE.md, README.md"
}, {"color": "--z-agent-docs", "couples": ["zone-rules"]});
MAP.add("agent-docs", "context-md", [1, 0], "Glossary", "CONTEXT.md\n35 terms, 5 sections", {
  "kicker": "CONTEXT.md:1-130",
  "title": "Domain glossary",
  "lead": "Defines the terms code, docs and UI text must use, such as Game frame, Breakpoint, Sprite frame, Timeline, COF and DCC, with the words to avoid.",
  "io": [
    [
      "Receives",
      "A term once it settles (AGENTS.md:5)"
    ],
    [
      "Produces",
      "Shared vocabulary for code, docs and UI text"
    ]
  ],
  "swap": "The rules use its terms (.claude/rules/ias-animation.md:20).",
  "extend": "Add the term under its section, with an _Avoid_ line when a confusing synonym exists (CONTEXT.md:12, 22).",
  "facts": [
    [
      "Sections",
      "Site, Speed, Attacks, Animation, Game files (CONTEXT.md:5, 18, 49, 74, 115)"
    ],
    [
      "Terms",
      "35"
    ]
  ],
  "warn": "Game frame and sprite frame differ: the screen counts game frames only (.claude/rules/ias-animation.md:34).",
  "see": [
    "agents-md"
  ],
  "src": "CONTEXT.md"
}, {"color": "--z-agent-docs"});
MAP.add("agent-docs", "zone-rules", [2, 0], "Zone rules", ".claude/rules/*.md\npaths: frontmatter", {
  "kicker": ".claude/rules/ias-animation.md:1-16",
  "title": "Path-scoped zone rules",
  "lead": "Six rule files, each with a paths: list. Claude Code loads a rule when it reads a file of that zone.",
  "io": [
    [
      "Receives",
      "Conventions as they settle in a zone"
    ],
    [
      "Produces",
      "Local rules: data sources, engine purity, share link format, UI text homes, test naming, the animation chain"
    ]
  ],
  "swap": "AGENTS.md:60-69 lists them. Another agent tool would need the same content without the paths: loading.",
  "extend": "A new zone gets a rule file with paths: and a line under Zone rules in AGENTS.md (AGENTS.md:60-69).",
  "facts": [
    [
      "Lines per file",
      "ias-animation 50, ias-data 22, ias-engine 23, ias-share-link 11, ias-tests 17, ias-ui 20"
    ],
    [
      "Commits touching them",
      "26 (git log)"
    ]
  ],
  "warn": "ias-animation.md spans four zones, and its paths overlap the other rules (ias-animation.md:2-15).",
  "see": [
    "agents-md"
  ],
  "src": ".claude/rules/"
}, {"color": "--z-agent-docs", "couples": ["agents-md"]});
MAP.add("agent-docs", "adrs", [0, 1], "ADRs", "docs/adr/\n0001 sprites \u00b7 0002 GPL", {
  "kicker": "docs/adr/0001-legacy-sprites-decoded-at-extraction.md:1-15",
  "title": "Architecture decision records",
  "lead": "Two decisions a reader would otherwise undo: legacy sprites are decoded at extraction and composed in the browser, and the GPL decoder stays in tools/.",
  "io": [
    [
      "Receives",
      "A choice made with the maintainer over decision rounds (ADR 0001:3)"
    ],
    [
      "Produces",
      "The options considered and the consequences"
    ]
  ],
  "swap": "Rules point to them: ias-animation.md:20 and ias-data.md:22 carry their constraints.",
  "extend": "Add one only for a choice that is hard to reverse, surprising, and a real trade-off (AGENTS.md:81).",
  "facts": [
    [
      "Count",
      "2"
    ],
    [
      "0001 options",
      "HD models, decode in the browser, bake whole frames (0001:7-9)"
    ],
    [
      "0002 options",
      "own decoder, the Go decoder as is, Go in WebAssembly (0002:7-9)"
    ]
  ],
  "see": [
    "d2-dcc",
    "sprite-sheets"
  ],
  "src": "docs/adr/"
}, {"color": "--z-agent-docs"});
MAP.add("agent-docs", "atlas", [3, 0], "This atlas", "docs/map/\nbun run map:walkthrough", {
  "kicker": "docs/map/README.md",
  "title": "d2-lab Atlas",
  "lead": "This page. The Map tab is hand-written data that <code>check.js</code> validates. The Walkthrough tab is generated from the engine and the sprites.",
  "io": [
    [
      "Receives",
      "Facts read in the repo, and the engine's output for one share link."
    ],
    [
      "Produces",
      "<code>docs/map/index.html</code> and its scripts, opened from the repo in a browser."
    ]
  ],
  "swap": "Nothing depends on it. <code>apps/ias/test/map-walkthrough.test.ts</code> fails when the walkthrough no longer matches the engine or the sprites.",
  "extend": "A component: a <code>MAP.add</code> in <code>data-nodes.js</code>, its flows in <code>MAP.links</code>, then <code>bun docs/map/check.js</code>. A change that adds, removes or rewires a component updates the map in the same commit.",
  "see": [
    "agents-md",
    "e-animation"
  ],
  "src": "docs/map/README.md; apps/ias/scripts/map-walkthrough.ts"
}, {"color": "--z-agent-docs"});

// ---------- flows between bricks ----------
L("d-game-data", "e-speed", "weapons by id");
L("d-game-data", "e-frames", "player frames");
L("d-game-data", "e-animation", "modes, animdata, looks");
L("d-game-data", "d-gear", "skill item types");
L("d-game-data", "e-form", "weapon list");
L("d-form", "e-form", "field rules, offers");
L("d-skills", "e-form", "class skills, oskills");
L("d-gear", "e-form", "requirements, runewords");
L("d-form", "e-normalize", "defaults, floor and ceiling rules");
L("d-skills", "e-speed", "skill rule");
L("d-speed", "e-speed", "buffs, caps");
L("d-speed", "e-frames", "speeds, wereform and merc frames");
L("d-skills", "e-acceleration", "rollback rule");
L("d-sprites", "e-animation", "tokens, outfit, steps");
L("d-original-text", "e-tables", "table headers");
L("e-form", "e-normalize", "spec, coerced selects");
L("e-speed", "e-acceleration", "EIAS values, limits");
L("e-frames", "e-acceleration", "frames, speed, start");
L("e-acceleration", "e-tables", "speed steps to rows");
L("e-acceleration", "e-animation", "step at current");
L("e-frames", "e-animation", "first hit, grip");
L("e-normalize", "ui-state", "spec, coerced, normalized");
L("e-tables", "ui-state", "Result, located rows");
L("ui-state", "ui-layout", "view, onEdit");
L("ui-layout", "ui-form-panels", "build, inputs, onEdit");
L("ui-form-panels", "ui-state", "BuildEdit");
L("ui-form-panels", "ui-weapon-picker", "offered weapons");
L("ui-layout", "ui-tables", "tables, normalized");
L("ui-tables", "ui-state", "table-variable edit");
L("ui-tables", "av-view", "normalized build, now, next");
L("ui-text", "ui-form-panels", "labels, bounds");
L("ui-text", "ui-tables", "row texts, tips");
L("e-animation", "av-view", "Timeline or Unavailable");
L("av-view", "av-sprites", "timeline");
L("av-clock", "av-view", "tick");
L("av-view", "av-scene", "sprites, placed tick");
L("av-shield", "av-view", "Shield");
L("d-sprites", "av-view", "shield graphics, shield skills");
L("d-skills", "av-view", "hit count choices");
L("av-labels", "av-view", "sentences");
L("c-animation", "av-sprites", "SpriteManifest");
L("e-form", "sl-params", "offered options");
L("e-normalize", "sl-params", "default to omit");
L("d-form", "sl-params", "field bounds");
L("lib-keys", "sl-params", "ordered keys");
L("sl-params", "sl-parse", "parameter order");
L("sl-params", "sl-serialize", "parameter order");
L("e-normalize", "sl-parse", "default start, normalize");
L("sl-parse", "ui-state", "build or error");
L("ui-state", "sl-serialize", "raw build");
L("sl-error-text", "ui-kit", "error line");
L("d-gear", "ui-weapon-picker", "categories");
L("d-gear", "ui-form-panels", "runeword bases");
L("e-form", "ui-form-panels", "neededRuneword");
L("app-html", "app-main", "module script");
L("app-main", "ui-state", "location.search");
L("app-build", "ui-state", "prerender, empty search");
L("app-build", "app-html", "CSP, prerender");
L("app-dev", "app-html", "routes");
L("app-html", "ui-kit", "braise.css, theme preview");
L("x-d2r", "casc-kit", "CASC storage, read-only mount");
L("x-casclib", "casc-kit", "source at pinned commit");
L("casc-kit", "game-cache", "tables, animdata.tsv, icon PNGs");
L("game-cache", "data-extract", "main cache dir + version");
L("game-cache", "assets-extract", "icon PNGs, skill tables");
L("game-cache", "sprite-sheets", "COF, DCC, palette");
L("data-extract", "d-game-data", "game-data.ts (GameData)");
L("d-game-data", "assets-extract", "gameData.weapons icons");
L("e-animation", "sprite-sheets", "offered builds, timelines");
L("assets-extract", "sprite-sheets", "offered animations, caches");
L("d2-dcc", "sprite-sheets", "decoded DCC frames");
L("x-od2", "d2-dcc", "ported Go source, oracle");
L("x-magick", "assets-extract", "icon WebP encoding");
L("x-magick", "sprite-sheets", "PNG to lossless WebP");
L("assets-extract", "game-assets", "portrait, skill, weapon WebP");
L("sprite-sheets", "game-assets", "sheets + manifest.json");
L("game-assets", "av-sprites", "game/... relative URLs");
L("x-original", "original-checkout", "git fetch @bcc112d");
L("original-checkout", "original-dump", "served Warren's calculator");
L("original-checkout", "golden-gen", "served Warren's calculator");
L("x-chromium", "golden-gen", "page pool");
L("x-chromium", "original-dump", "page to import constants.js");
L("c-build", "golden-gen", "CharacterId type (cases.ts:1)");
L("original-dump", "unit-tests", "original-constants.json");
L("golden-gen", "goldens", "jsonl, forms.json, meta.json");
L("golden-gen", "calc-goldens", "original-form.ts types");
L("goldens", "calc-goldens", "input + output per case");
L("goldens", "form-snapshots", "cases + forms.json");
L("goldens", "golden-checks", "every case");
L("deviations", "form-snapshots", "removed, added, floors, ceilings");
L("calc-goldens", "e-tables", "computeTables(original build)");
L("form-snapshots", "e-form", "availableInputs, normalize");
L("sprite-sheets", "sprite-test", "offeredAnimations()");
L("game-assets", "sprite-test", "manifests, sheets");
L("av-sprites", "sprite-test", "isSpriteManifest");
L("golden-checks", "e-animation", "attackTimeline, computeTables");
L("golden-checks", "sl-parse", "serialize, parse round trip");
L("app-build", "dist-check", "apps/ias/dist/");
L("app-build", "smoke", "dist/ under /d2-lab/");
L("app-build", "layout", "dist/ under /d2-lab/");
L("x-chromium", "smoke", "Playwright browser");
L("x-chromium", "layout", "Playwright browser + axe");
L("x-gh-pages", "lighthouse", "live page");
L("x-github", "ci-check", "push, PR, dispatch");
L("ci-check", "app-build", "bun run e2e builds dist/");
L("ci-check", "ci-deploy", "artifact site (dist/)");
L("ci-deploy", "x-gh-pages", "Pages artifact, deploy-pages");
L("ci-deploy", "ci-verify", "needs: deploy");
L("x-gh-pages", "ci-verify", "live index.html");
L("ci-verify", "smoke", "SMOKE_URL");
L("ci-verify", "lighthouse", "SMOKE_URL");
L("x-gh-pages", "x-browser", "static site under /d2-lab/");
L("pre-commit", "lint-format", "oxfmt, oxlint");
L("pins", "ci-check", "runs inside bun test");
L("agents-md", "zone-rules", "links by zone");
L("agents-md", "context-md", "terms to use");
L("adrs", "d2-dcc", "GPL isolation rule");
L("e-animation", "atlas", "Timeline of the walkthrough");
