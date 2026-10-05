# d2-lab Atlas

A page for a new contributor, human or agent: a zoomable map of the repo, and one build followed through the engine. Open `index.html` in a browser, straight from the repo: it needs no server and no build.

- **Map**: one zone per part of the repo, one brick per component you can replace on its own. A brick's panel gives its contract, what to touch to replace it, the bricks that change with it, and how to extend it. Hand-written in `data-zones.js`, `data-nodes.js` and `data-edges.js`; every fact cites its file.
- **Walkthrough**: the Zeal Paladin share link through `parseShareLink`, `resolveForm`, `normalize`, `eiasValues`, `computeTables` and `attackTimeline`, with the attack drawn from the legacy sprites. `data-walkthrough.js` is generated: `bun run map:walkthrough` writes it, and `apps/ias/test/map-walkthrough.test.ts` fails when it no longer matches the engine or the sprites.

## Change it

1. A change that adds, removes or rewires a component of the repo updates the map in the same commit.
2. Run `bun docs/map/check.js`: it fails on unknown or duplicate ids, a brick outside its zone, and bricks that overlap. Arrow crossings and text overflow need a look at the page.
3. After a change to the engine, the share link or the sprites: `bun run map:walkthrough`.

`oxlint` and `oxfmt` skip `docs/`.
