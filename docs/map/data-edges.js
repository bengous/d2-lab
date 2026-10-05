// E(from, to, label, opts): one arrow between zones or outside systems,
// drawn at the overview. Flows between bricks live in MAP.links instead.
//   from, to  brick ids, or "z:<zone>" for a zone frame
//   label     what moves along the arrow, in a few words
//   pts       [[x, y], …] the whole path, ends included (see the layout at
//             the top of data-zones.js: arrows run in the 40-unit gaps)
//   kind      "dash": a check against, not a flow
//   lp, lt    label on segment `lp` (default: the longest), at fraction `lt`
// An arrow may end on the app group's frame (y 804): it then enters the app
// as a whole. Check a new route on the rendered page: crossings are not
// detected by check.js.
const E = (from, to, label, opts) => MAP.edges.push(Object.assign({ from, to, label, level: "far" }, opts || {}));

// The game and its tools feed the extraction
E("x-d2r", "z:extraction", "CASC", { pts: [[260, 166], [300, 166]] });
E("x-casclib", "z:extraction", "source", { pts: [[260, 236], [300, 236]] });
E("x-magick", "z:extraction", "WebP", { pts: [[260, 306], [300, 306]] });
E("x-od2", "z:extraction", "DCC port", { pts: [[260, 376], [300, 376]] });

// The app, left to right
E("z:extraction", "z:data", "game-data.ts", { pts: [[656, 200], [716, 200]] });
E("z:data", "z:engine", "rules", { pts: [[904, 260], [968, 260]] });
E("z:engine", "z:ui", "spec, tables", { pts: [[1324, 200], [1388, 200]] });
E("z:engine", "z:share-link", "form, normalize", { pts: [[1146, 392], [1146, 432]] });
E("z:share-link", "z:ui", "build or error", {
  pts: [
    [1324, 480],
    [1356, 480],
    [1356, 330],
    [1388, 330],
  ],
  lp: 1,
});
E("z:ui", "z:attack-view", "build, now, next", { pts: [[1566, 392], [1566, 432]] });

// The oracle and the checks
E("x-original", "z:golden", "@bcc112d", { pts: [[260, 546], [300, 546]] });
E("z:golden", "z:engine", "pins the output", {
  kind: "dash",
  pts: [
    [656, 626],
    [940, 626],
    [940, 380],
    [968, 380],
  ],
  lp: 0,
});
E("z:golden", "z:tests", "45,990 cases", { pts: [[478, 712], [478, 850]] });
E("z:tests", "z:contracts", "checks the app", { kind: "dash", pts: [[900, 850], [900, 804]] });
E("x-chromium", "z:tests", "Playwright", { pts: [[260, 926], [300, 926]] });

// Build, deploy, serve
E("z:app-shell", "z:contracts", "bundles the app", { pts: [[1210, 850], [1210, 804]] });
E("z:app-shell", "z:ci", "dist/", { pts: [[1388, 928], [1428, 928]] });
E("z:ci", "x-gh-pages", "deploy-pages", { pts: [[1784, 906], [1824, 906]] });
E("x-github", "z:ci", "push, PR", { pts: [[1824, 1026], [1784, 1026]] });
E("x-gh-pages", "x-browser", "static site", { pts: [[1944, 880], [1944, 502]] });
