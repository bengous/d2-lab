// World layout, in SVG units (the viewBox zooms over it; see index.html).
// It reads left to right, like a build:
//   x 20-260     outside sources: the game, its tools, Warren's calculator
//   x 280-1804   the repo frame
//     x 300-656    Extraction (top), then Golden oracle
//     x 696-1764   the app group, apps/ias/src: Data (a column), Engine, UI,
//                  then Share link under Engine, Attack view under UI, and
//                  Contracts as the foundation band at the bottom
//     y 850-1064   the lower lane: Tests, App shell, CI and deploy
//     y 1046-1202  Agent docs, under Tests
//   x 1824-2104  outside, on the web: title block, browser, Pages, the GitHub repo
// A zone holds a grid of bricks: `cols` x `rows` slots of 168 x 58 units,
// so w = cols * 168 + 20 and h = rows * 58 + 40. Keep 40 units between
// zones: arrows between zones run there, with their labels.
//
// Every `info` object (overview, zones, nodes) feeds the right panel. All
// fields are optional; HTML is allowed (<code>), and the panel shows them in
// this order:
//   kicker  small mono line above the title: the source file and lines
//   title   panel heading
//   lead    what it is, in one or two sentences
//   io      [["Receives", …], ["Produces", …]]: the brick's contract
//   swap    what to touch to replace or remove it ("To replace")
//   extend  how to grow it ("To extend")
//   seams, traps   overview only: [brickId, text] extension points and couplings
//   why     reasons for the current design, each with its source
//   alt     alternatives already rejected or postponed
//   facts   [label, value] pairs, measured
//   warn    one open point or trap, shown boxed
//   how     reading instructions (overview)
//   see     ids of related zones or bricks, as chips
//   src     longer source reference, at the bottom
window.MAP = { W: 2124, H: 1250, nodes: [], edges: [], links: [] };

MAP.frame = { x: 280, y: 20, w: 1524, h: 1202, title: "d2-lab", subX: 170, sub: "bengous/d2-lab · Bun monorepo" };

// Dashed frames around the zones of one part, with a caption.
MAP.groups = [
  {
    x: 696,
    y: 80,
    w: 1068,
    h: 724,
    title: "The app",
    sub: "apps/ias/src · each layer imports only the layers below it",
  },
];

MAP.labels = [
  { x: 20, y: 126, text: "SOURCES" },
  { x: 1824, y: 436, text: "ON THE WEB" },
];

MAP.cartouche = {
  x: 1824,
  y: 40,
  w: 280,
  h: 180,
  title: "d2-lab",
  rows: [
    ["Runtime", "Bun 1.4.2"],
    ["Game", "D2R 3.3.93847"],
    ["Oracle", "Warren1001 @bcc112d"],
    ["Revision", "2026-10-05"],
  ],
};

// Order of the ← → zone tour in the panel, and of the overview chips.
MAP.zoneOrder = ["extraction", "data", "engine", "share-link", "ui", "attack-view", "contracts", "golden", "tests", "app-shell", "ci", "agent-docs"];

MAP.overview = {
  "kicker": "AGENTS.md · CONTEXT.md · README.md",
  "title": "d2-lab",
  "lead": "A Bun monorepo of Diablo II: Resurrected calculators. The first one, the IAS Calculator, tells how many game frames an attack takes for a build and which speed reaches the next breakpoint, then plays that attack with the game's own sprites.",
  "why": [
    "The calculator is one pure pipeline around <code>Build</code>: <code>resolveForm</code> gives the form, <code>normalize</code> bounds the build, <code>computeTables</code> gives the breakpoint tables, and <code>attackTimeline</code> the animation. The Walkthrough tab follows one build through it.",
    "Every game or original fact is a record of <code>data/rules/</code> with its <code>source</code>. The game data and the sprite sheets are extracted from a local install and committed, so CI never needs the game.",
    "Warren's calculator at <code>bcc112d</code> is the oracle: 45,990 golden cases pin its output, including where it differs from the game, except the deviations the repo lists.",
    "A layer imports only the layers below it: contracts and lib, data, engine, share-link, ui. oxlint enforces it."
  ],
  "facts": [
    [
      "Zones",
      "12"
    ],
    [
      "Bricks",
      "75, plus 10 outside systems"
    ],
    [
      "Golden cases",
      "45,990 in 23 files"
    ],
    [
      "Weapons",
      "292: 291 bases plus unarmed"
    ],
    [
      "Committed sprite files",
      "2,539"
    ],
    [
      "Game version",
      "D2R 3.3.93847"
    ]
  ],
  "how": "Each zone is a part of the repo, each brick a component you can replace on its own. Click a zone to zoom in, then a brick: the map outlines in gold the bricks it reads from or feeds, and in dashed orange the bricks that change with it. A path without a leading apps/, tools/, docs/ or a root file is under apps/ias/src/.",
  "seams": [
    [
      "c-build",
      "A speed or slow field: add it to <code>SpeedSources</code> or <code>Slows</code>, then <code>bun run check</code> lists the records to fill."
    ],
    [
      "d-speed",
      "<code>levelBuffs</code>: the EIAS a skill level grants, and its table variable."
    ],
    [
      "d-form",
      "<code>floorRules</code> and <code>ceilingRules</code>: what a build must carry, or cannot exceed."
    ],
    [
      "d-skills",
      "<code>oskills</code>: a skill an item grants."
    ],
    [
      "deviations",
      "<code>goldenDeviations</code>: an option or field of the original form that the game forbids."
    ],
    [
      "e-animation",
      "A skill whose mode is in <code>skills.txt</code>: nothing to write. Extract, then test."
    ],
    [
      "ui-layout",
      "A second tool: an item in <code>ToolMenu</code> (<code>ui/screens/page-chrome.tsx</code>)."
    ]
  ],
  "traps": [
    [
      "e-speed",
      "A new <code>TableVariable</code> without a <code>levelBuffs</code> entry for it compiles, then throws at run time."
    ],
    [
      "d-skills",
      "A new skill needs its name in <code>skillNames</code>, a <code>Map</code> that throws at run time when the name is missing."
    ],
    [
      "sl-params",
      "Link parameter names are fixed by format v1, and their declaration order is the link order a test pins."
    ],
    [
      "e-acceleration",
      "<code>rollbackHits</code> feeds both the rollback rows and the timeline: change it only there."
    ],
    [
      "e-tables",
      "The calculation goldens read no deviation: an output change needs an output deviation designed first."
    ],
    [
      "av-sprites",
      "Every clip the engine plays needs its committed sheets, or the view says files are missing and the smoke test fails."
    ]
  ],
  "src": "AGENTS.md; CONTEXT.md; README.md; .claude/rules/"
};

// A zone is a part of the repo drawn as a frame. Zoomed out it shows `title`,
// `tag` and the three `kw` keywords; zoomed in, its bricks.
//   color   a --z-* token of index.html
MAP.zones = [
  {
    "id": "extraction",
    "x": 300,
    "y": 120,
    "w": 356,
    "h": 272,
    "color": "--z-extraction",
    "title": "Extraction",
    "tag": "apps/ias/scripts/",
    "kw": [
      "CASC read-only",
      "generated game data",
      "sprite sheets"
    ],
    "info": {
      "kicker": "apps/ias/scripts/",
      "title": "Game files and extraction",
      "lead": "Reads the local D2R install through a read-only CASC kit and writes the two committed outputs the app reads: <code>src/data/generated/game-data.ts</code> and <code>public/game/</code>. It runs only on a machine with the game installed. CI never runs it.",
      "why": [
        "Game data is generated from the D2R 3.3.93847 install and committed. Its 291 weapon bases match the WSM of Warren's calculator (apps/ias/test/data.test.ts:151).",
        "Every CASC access mounts the install read-only. CascLib is patched because it opens .build.info read-write (tools/d2r-data/README.md:89-95).",
        "Extracted assets are committed because CI has no install to extract from (docs/adr/0001-legacy-sprites-decoded-at-extraction.md:13).",
        "Sprites are decoded at extraction and composed in the browser: 37 KB per view instead of 276 KB, and no decoder ships to visitors (docs/adr/0001-legacy-sprites-decoded-at-extraction.md:3-9).",
        "The GPL decoder sits in tools/ so the site distributes images, never GPL code (docs/adr/0002-gpl-dcc-decoder-isolated-in-tools.md:3).",
        "Sprite files live in their own caches, so adding them never rebuilds the main cache (apps/ias/scripts/game-files.ts:158-164)."
      ],
      "swap": "The committed outputs keep the site building and the tests green. What breaks is regeneration: a game patch, a new weapon or a new animated skill has no way into game-data.ts or public/game/ (.claude/rules/ias-data.md:13, .claude/rules/ias-animation.md:40).",
      "facts": [
        [
          "Game version",
          "3.3.93847 (game-data.ts:2)"
        ],
        [
          "game-data.ts",
          "5,090 lines, 142,308 B (wc)"
        ],
        [
          "public/game",
          "2,681 files, 6,815,776 B (git ls-files)"
        ],
        [
          "Extraction code",
          "scripts/: 7 data files, 1,272 lines; sprites/: 4 files, 541 lines"
        ],
        [
          "CASC storage",
          "28 GB (tools/d2r-data/README.md:85)"
        ]
      ],
      "src": "AGENTS.md:17-19, .claude/rules/ias-data.md, .claude/rules/ias-animation.md:22-29, tools/d2r-data/README.md"
    }
  },
  {
    "id": "data",
    "x": 716,
    "y": 120,
    "w": 188,
    "h": 446,
    "color": "--z-data",
    "title": "Data",
    "tag": "apps/ias/src/data/",
    "kw": [
      "Sourced rules",
      "Game data",
      "Read by engine"
    ],
    "info": {
      "kicker": "apps/ias/src/data/",
      "title": "Data",
      "lead": "Every game or original fact the engine or UI reads: <code>generated/game-data.ts</code>, written by <code>bun run data:extract</code>, and 22 hand-written rule files in <code>rules/</code>. Each record carries its <code>source</code>.",
      "why": [
        "Game data is generated from the D2R 3.3.93847 install and committed. Rules the game hardcodes (sequences, rollbacks, skill frames, EIAS caps) stay hand-written with their source (.claude/rules/ias-data.md:11).",
        "The engine keeps rules in data and its functions pure (.claude/rules/ias-engine.md:10). Extend a list the engine already reads before adding a branch in the engine (.claude/rules/ias-data.md:12).",
        "A <code>source</code> names where each fact was read: <code>calculator.js</code> of Warren's calculator at <code>bcc112d</code>, a game file record at 3.3.93847, D2MOO at <code>5596f5c</code>, an external source, or a decision stated in full (.claude/rules/ias-data.md:11)."
      ],
      "swap": "Readers of this zone:<ul><li>The engine reads every rule.</li><li>The share link reads <code>field-values.ts</code> (share-link/params.ts:12-18).</li><li>The UI reads game data and rules directly (ui/screens/labels.ts:13-14, option-hints.ts:9-12, weapon-panel.tsx:6-7, attack-view.tsx:8-10).</li></ul><code>data</code> imports neither <code>engine</code>, <code>share-link</code> nor <code>ui</code> (oxlint.config.ts:63).",
      "src": "AGENTS.md:37; .claude/rules/ias-data.md:11-22"
    }
  },
  {
    "id": "engine",
    "x": 968,
    "y": 120,
    "w": 356,
    "h": 272,
    "color": "--z-engine",
    "title": "Engine",
    "tag": "apps/ias/src/engine/",
    "kw": [
      "Pure functions",
      "Tables and timeline",
      "Pinned by goldens"
    ],
    "info": {
      "kicker": "apps/ias/src/engine/",
      "title": "Engine",
      "lead": "Pure functions around <code>Build</code>:<ul><li><code>resolveForm</code> gives the <code>InputSpec</code>.</li><li><code>normalize</code> coerces and bounds the build.</li><li><code>computeTables</code> gives the breakpoint tables.</li><li><code>attackTimeline</code> gives the attack's <code>Timeline</code>.</li></ul>",
      "why": [
        "Rules in data, pure synchronous functions, no Effect; React only displays (AGENTS.md:31; .claude/rules/ias-engine.md:10).",
        "No DOM, no clock, no state (.claude/rules/ias-engine.md:10).",
        "The timeline reuses the speed steps and the rollback recurrence of the tables, so the animation cannot disagree with the Now row (.claude/rules/ias-animation.md:26).",
        "The output matches Warren's calculator at <code>bcc112d</code>, including where it differs from the game, and goldens check it (.claude/rules/ias-engine.md:11)."
      ],
      "swap": "Callers outside the zone:<ul><li>The share link calls <code>availableInputs</code>, <code>normalize</code> and <code>defaultBuild</code> (share-link/params.ts:19-20, parse.ts:4-6, serialize.ts:2).</li><li>The UI calls <code>resolveBuild</code>, <code>computeTables</code>, <code>locate</code>, <code>primaryTable</code>, <code>withBounds</code> and <code>withTableVariable</code> (ui/screens/calculator-state.ts:4-9, build-edit.ts:2), <code>attackTimeline</code> (attack-view.tsx:11), <code>neededRuneword</code> (weapon-panel.tsx:8), and <code>levelEias</code> and <code>iasToEias</code> (option-hints.ts:13-14).</li></ul>The calculation goldens must stay unchanged (.claude/rules/ias-engine.md:11).",
      "src": "apps/ias/src/engine/; .claude/rules/ias-engine.md:1-23; AGENTS.md:31-39"
    }
  },
  {
    "id": "share-link",
    "x": 968,
    "y": 432,
    "w": 356,
    "h": 156,
    "color": "--z-share-link",
    "title": "Share link",
    "tag": "apps/ias/src/share-link/",
    "kw": [
      "Link format v1",
      "Parse and serialize",
      "Named errors"
    ],
    "info": {
      "kicker": "apps/ias/src/share-link/",
      "title": "Share link",
      "lead": "Turns a query string into a normalized <code>Build</code> and back. Format version 1: readable parameters, writing only the ones that differ from the default build.",
      "why": [
        "Readable, versioned parameters without the fields at their default. An invalid link shows a named error and loads the default build. There is no reader for the old <code>?data=</code>, as no identified consumer points to the site.",
        "Parameter names are part of the format: a renamed parameter breaks links already shared (.claude/rules/ias-share-link.md:8)."
      ],
      "swap": "The UI loads a link with <code>loadLink</code> (ui/screens/calculator-state.ts:66-76), writes one in <code>copyLink</code> (ui/screens/calculator.tsx:9-13) and shows errors through <code>LinkErrorNotice</code> (ui/components/link-error-notice.tsx:3-4). Links already shared depend on the format.",
      "src": "apps/ias/src/share-link/; .claude/rules/ias-share-link.md:1-11"
    }
  },
  {
    "id": "ui",
    "x": 1388,
    "y": 120,
    "w": 356,
    "h": 272,
    "color": "--z-ui",
    "title": "UI",
    "tag": "apps/ias/src/ui/",
    "kw": [
      "Raw state, BuildEdit",
      "Panels and tables",
      "Braise theme"
    ],
    "info": {
      "kicker": "apps/ias/src/ui/",
      "title": "UI",
      "lead": "React 19 screens: the raw state and its <code>calculatorView</code>, the form panels that send <code>BuildEdit</code>s, the breakpoint tables, the UI texts, and the component kit with the Braise theme.",
      "why": [
        "The UI keeps its raw state so typed values survive when a field hides and shows again. The engine and the link receive <code>normalize(state)</code>, and React only displays (.claude/rules/ias-ui.md:11).",
        "A panel never writes a build: it sends a <code>BuildEdit</code>, and <code>applyEdit</code> lands it on the raw state (.claude/rules/ias-ui.md:11).",
        "The theme is dark only (src/styles/braise.css:34-35)."
      ],
      "swap": "<code>main.tsx</code> and <code>build.ts</code> render <code>Calculator</code> (main.tsx:5,15; build.ts:9,32). No lower layer imports <code>ui</code> (oxlint.config.ts:61-65).",
      "src": "apps/ias/src/ui/; .claude/rules/ias-ui.md:1-20"
    }
  },
  {
    "id": "attack-view",
    "x": 1388,
    "y": 432,
    "w": 356,
    "h": 214,
    "color": "--z-attack-view",
    "title": "Attack view",
    "tag": "apps/ias/src/ui/screens/attack-*",
    "kw": [
      "Legacy sprites",
      "25 game frames/s",
      "View state only"
    ],
    "info": {
      "kicker": "apps/ias/src/ui/screens/attack-*",
      "title": "Attack view",
      "lead": "Plays the build's attack at its current breakpoint with the game's legacy sprites. Fetches the clip's sheets, stacks each tick's layers on a canvas, runs a 25 game frames per second clock, and explains the frames in sentences.",
      "why": [
        "Legacy sprites are decoded at extraction and composed in the browser. This is closer to the game than the HD models and lighter per view than decoding in the browser, and the layers let Smite's shield picker and Holy Shield land as a few more <code>sh</code> sheets (docs/adr/0001-legacy-sprites-decoded-at-extraction.md:3-9).",
        "The site ships images, never the GPL decoder (docs/adr/0002-gpl-dcc-decoder-isolated-in-tools.md:3).",
        "The screen counts game frames only; sprite frames never reach UI text (.claude/rules/ias-animation.md:34)."
      ],
      "swap": "<code>BreakpointsPanel</code> renders <code>AttackView</code> with the normalized build and the Now and Next rows (ui/screens/breakpoints-panels.tsx:102). Removing it leaves the tables intact. <code>e2e/smoke.e2e.ts</code> fails on any missing sprite file (.claude/rules/ias-ui.md:16).",
      "src": ".claude/rules/ias-animation.md:1-50; .claude/rules/ias-ui.md:16"
    }
  },
  {
    "id": "contracts",
    "x": 716,
    "y": 686,
    "w": 1028,
    "h": 98,
    "color": "--z-contracts",
    "title": "Contracts",
    "tag": "apps/ias/src/contracts/",
    "kw": [
      "Shared types",
      "Bottom layer",
      "A change hits all"
    ],
    "info": {
      "kicker": "apps/ias/src/contracts/",
      "title": "Contracts and lib",
      "lead": "Types every layer shares: the <code>Build</code>, the form's <code>InputSpec</code>, the <code>Result</code> tables, the animation <code>Timeline</code>, the shape of the generated game data, and the signatures of the engine and share link functions. <code>lib/keys.ts</code> holds one helper.",
      "why": [
        "The contracts came first, so data, goldens of Warren's calculator, engine and UI could then advance in parallel.",
        "The <code>Timeline</code> contract is the seam for a future HD renderer that would read the same ticks (.claude/rules/ias-animation.md:29).",
        "<code>keysOf</code> lists a <code>Record</code> over a union, so a list grows with the union and the compiler sees a missing field (lib/keys.ts:1-4; .claude/rules/ias-engine.md:13)."
      ],
      "swap": "Every layer imports them. oxlint forbids contracts and lib from importing any other layer (oxlint.config.ts:61-62). A change to <code>src/contracts/</code> changes every layer and must be named in the plan (.claude/rules/ias-engine.md:10).",
      "src": "apps/ias/src/contracts/*.ts; apps/ias/src/lib/keys.ts; oxlint.config.ts:61-62"
    }
  },
  {
    "id": "golden",
    "x": 300,
    "y": 440,
    "w": 356,
    "h": 272,
    "color": "--z-golden",
    "title": "Golden oracle",
    "tag": "tools/ias-golden/",
    "kw": [
      "Warren's calculator @bcc112d",
      "45,990 cases",
      "golden deviations"
    ],
    "info": {
      "kicker": "tools/ias-golden/",
      "title": "Golden oracle",
      "lead": "Replays Warren's calculator in Chromium and records what it shows for every reachable build. The app is then checked against those records. It must match the original output, including where it differs from the game, except for the deviations it lists.",
      "why": [
        "Warren's calculator keeps hidden state: the same build gives different tables depending on click order. So each case replays from a fresh page in a fixed order (apps/ias/test/goldens/README.md:20).",
        "Warren's calculator never enters the tree. It is cloned at bcc112d into a temp dir only when needed (tools/ias-golden/upstream.ts:59-62).",
        "Weapons are grouped by (type, WSM): a probe found 0 difference over the 241,246 configurations that share a key.",
        "constants.js touches document when it loads, so original:dump imports it inside a Chromium page (tools/ias-golden/original-constants.ts:35).",
        "Forms are stored once in forms.json and cases reference them, while outputs stay inline so each golden diff stays readable (apps/ias/test/goldens/README.md:8)."
      ],
      "swap": "Without it, the calculation suites, the form snapshots, goldens.share-link and goldens.animation lose their input, and data.test.ts loses its fixture. Nothing would check parity with Warren's calculator (.claude/rules/ias-tests.md:11-15).",
      "facts": [
        [
          "Upstream",
          "Warren1001/IAS_Calculator @bcc112d (tools/ias-golden/upstream.ts:5-7)"
        ],
        [
          "Cases",
          "45,990 (apps/ias/test/goldens/meta.json:6)"
        ],
        [
          "Goldens size",
          "42,553,488 B in 26 files (measured)"
        ],
        [
          "Generation time",
          "538 s, 0 page errors (measured)"
        ],
        [
          "Tool code",
          "10 files, 1,402 lines (wc)"
        ]
      ],
      "src": "AGENTS.md:20-21, .claude/rules/ias-tests.md, apps/ias/test/goldens/README.md"
    }
  },
  {
    "id": "tests",
    "x": 300,
    "y": 850,
    "w": 692,
    "h": 156,
    "color": "--z-tests",
    "title": "Tests",
    "tag": "apps/ias/test/ · apps/ias/e2e/",
    "kw": [
      "119,121 bun tests",
      "e2e on built dist/",
      "axe and Lighthouse"
    ],
    "info": {
      "kicker": "apps/ias/test/ · apps/ias/e2e/",
      "title": "Tests and e2e",
      "lead": "bun test runs the unit, data, sprite and golden-wide tests. bun run e2e builds dist/, checks its files, then tests it in Chromium. Two of the browser checks run again on the live site after each deploy.",
      "why": [
        "Tests that read every golden case are named goldens.*: the pre-commit hook skips them and CI runs them (.claude/rules/ias-tests.md:12).",
        "Budgets sit about 5 % over the measured sizes, so a jump fails and a fix passes (apps/ias/e2e/dist.e2e.ts:26).",
        "dist/ is served under /d2-lab/ only, so a URL that escapes the prefix fails as it would on Pages (apps/ias/e2e/site.ts:19).",
        "Lighthouse floors sit below the measured scores because CI runners vary (apps/ias/e2e/lighthouse.e2e.ts:14)."
      ],
      "swap": "CI's check job runs bun test and bun run e2e before uploading the site, and deploy needs check (.github/workflows/ci.yml:34-36, 46). Without these tests, a broken dist/ would be published.",
      "facts": [
        [
          "bun test",
          "119,121 pass, 0 fail, 313,091 expect() calls, 33 files, 270.6 s on this machine (measured 2026-10-05)"
        ],
        [
          "AGENTS.md figure",
          "about 110 s (AGENTS.md:15)"
        ],
        [
          "Test files",
          "31 in apps/ias/test (6 named goldens.*), 1 in tools/"
        ],
        [
          "e2e code",
          "6 files, 1,008 lines (wc)"
        ]
      ],
      "src": ".claude/rules/ias-tests.md, package.json:12-13, bunfig.toml:10-11"
    }
  },
  {
    "id": "app-shell",
    "x": 1032,
    "y": 850,
    "w": 356,
    "h": 156,
    "color": "--z-app-shell",
    "title": "App shell",
    "tag": "apps/ias/",
    "kw": [
      "Bun dev server",
      "Prerendered page",
      "Page CSP"
    ],
    "info": {
      "kicker": "apps/ias/",
      "title": "App shell",
      "lead": "The entry points around the UI:<ul><li><code>index.html</code> and <code>theme.html</code>.</li><li><code>src/main.tsx</code>, which hydrates or renders <code>Calculator</code>.</li><li><code>build.ts</code>, which bundles, prerenders and adds the CSP.</li><li><code>dev.ts</code>, the dev server.</li></ul>",
      "why": [
        "The default build is prerendered so it paints before the JS loads (build.ts:31-32).",
        "GitHub Pages sends no security header, so the page carries its own CSP (build.ts:48).",
        "<code>dev.ts</code> restarts the server when a source file is added or removed or a config changes. Bun's dev server resolves an <code>@/</code> import of a new file as missing, and its HMR ignores the server script and configs (dev.ts:16-19).",
        "Fonts stay external URLs, because Bun would inline a small font as base64 (public-files-plugin.ts:3-6)."
      ],
      "swap": "CI deploys the built <code>dist/</code> to GitHub Pages (AGENTS.md:43). <code>bun run dev</code>, <code>build</code> and <code>e2e</code> call these files (package.json:9-13).",
      "src": "apps/ias/dev.ts; apps/ias/build.ts; apps/ias/src/main.tsx; apps/ias/index.html; apps/ias/theme.html; apps/ias/public-files-plugin.ts"
    }
  },
  {
    "id": "ci",
    "x": 1428,
    "y": 850,
    "w": 356,
    "h": 214,
    "color": "--z-ci",
    "title": "CI and deploy",
    "tag": ".github/workflows/ci.yml",
    "kw": [
      "check, deploy, verify",
      "Pages via Actions",
      "oxlint layers"
    ],
    "info": {
      "kicker": ".github/workflows/ci.yml",
      "title": "CI, deploy and tooling",
      "lead": "On main, GitHub Actions checks and tests the code, publishes the tested dist/ to GitHub Pages, then tests the live site. Lint, format, a pre-commit hook and exact pins guard every commit.",
      "why": [
        "The source is public, so Pages deploys straight from the CI run: no second repo, no deploy key (.github/workflows/ci.yml:48-65).",
        "The page carries its own CSP because Pages sends no security header (apps/ias/build.ts:48).",
        "Layers are checked by no-restricted-imports, so their order is enforced, not only written (oxlint.config.ts:4-24, 61-65).",
        "complexity 10 is the McCabe threshold, and size limits skip blank lines and comments (oxlint.config.ts:43-45)."
      ],
      "swap": "Without CI, no commit reaches https://bengous.github.io/d2-lab/ (AGENTS.md:43). Without oxlint, nothing enforces the layer order, type checks or the oxslop comment rule (oxlint.config.ts:27-67).",
      "facts": [
        [
          "Bun",
          "1.4.2 (package.json:32)"
        ],
        [
          "Actions",
          "pinned by SHA (ci.yml:26, 29, 37, 55, 86, 89, 92)"
        ],
        [
          "Default permissions",
          "{} (ci.yml:9)"
        ]
      ],
      "src": ".github/workflows/ci.yml, AGENTS.md:41-43"
    }
  },
  {
    "id": "agent-docs",
    "x": 300,
    "y": 1046,
    "w": 692,
    "h": 156,
    "color": "--z-agent-docs",
    "title": "Agent docs",
    "tag": "AGENTS.md · .claude/rules/ · docs/",
    "kw": [
      "short index + rules",
      "glossary terms",
      "ADRs, atlas"
    ],
    "info": {
      "kicker": "AGENTS.md · .claude/rules/ · docs/",
      "title": "Agent context and docs",
      "lead": "The text an agent or a new contributor reads before touching code: a short index, a glossary, zone rules that Claude Code loads by path, two ADRs and this atlas.",
      "why": [
        "AGENTS.md stays a short index, and the detail of each zone goes to .claude/rules/*.md with paths: (AGENTS.md:60-69).",
        "An ADR records only a choice that is hard to reverse, surprising, and a real trade-off (AGENTS.md:81).",
        "Plans and research notes are kept outside the repo: a data rule states its fact or decision in full (.claude/rules/ias-data.md:11)."
      ],
      "swap": "Removing them removes the rules Claude Code loads when it reads a file of a zone (AGENTS.md:62).",
      "facts": [
        [
          "AGENTS.md",
          "87 lines; CLAUDE.md is the line @AGENTS.md"
        ],
        [
          "CONTEXT.md",
          "130 lines, 35 terms in 5 sections"
        ],
        [
          "Zone rules",
          "6 files, 143 lines"
        ],
        [
          "ADRs",
          "2"
        ]
      ],
      "src": "AGENTS.md, CONTEXT.md, .claude/rules/, docs/"
    }
  }
];
