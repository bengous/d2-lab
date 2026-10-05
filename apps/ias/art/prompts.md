# Art registry

Every image in `apps/ias/public/art/` is AI-generated fan art, made from the prompts below. Diablo may appear as fan art (decision of 2026-10-01); no Blizzard or game logo, no official art, no text in an image: every text of the page is HTML.

The image generator caps a 3:1 request at 2172x724, whatever size the prompt asks for.

| File           | Role                                   | Date       |
| -------------- | -------------------------------------- | ---------- |
| `banner.webp`  | Burning city and Diablo behind the top | 2026-10-01 |
| `skyline.webp` | Ruined town in fog behind the footer   | 2026-10-01 |

## skyline.webp

- Output: bottom 400 rows (y 324-723) of the 2172x724 source, WebP q85 method 6, 32,062 bytes, sha256 `0ac54655e6c2b4127aa21ed7057e8ba5a092688e432bd765772f3c031ce1cfda`.
- Display: decorative `<img alt="" loading="lazy">`, `opacity-60`, `mask-t-from-45%`, `mix-blend-lighten` (its black, luma 4, is darker than the page, luma 6), over the CSS `fog-glow` haze.
- One run, 2 variants (A dense town, B more fog and one cathedral); A kept by the user:

```
View these images first:
- skyline-bright.png: the current footer background of a Diablo II fan calculator web app, brightened 4x for review (on the site it is much darker and drawn at 50% opacity). The idea is approved (a distant ruined gothic city in cold fog), but it is too low resolution and too generic.
- concept-1.png: the approved art direction; look at its bottom 100 pixels.

Generate a new footer skyline, much higher definition and closer to the Diablo II universe, as fan art.

Canvas: 3840x1280 (3:1 landscape). Request that exact size from image_gen. If the tool cannot do 3840x1280, use the largest 3:1 or widest landscape size it supports, and report the size you got.

Layout: the site keeps only the bottom 640 rows (y 640-1279), drawn full width behind the footer text. Above y 700 the canvas is flat #060607 with no detail. In the bottom 640 rows: a long, low skyline across the full width, as dark silhouettes in cold fog. The tallest spires reach y 950 (330 px above the bottom edge). The skyline is denser in the left third and near the right edge, lower and sparser in the center, where the footer text sits. The left, right and bottom edges fade to #060607.

Content, Diablo II mood: the ruins of a gothic Sanctuary town and its cathedral, a crumbling monastery gate, broken watchtowers, wooden palisades, bare dead trees, a few crooked graveyard crosses and tombstones in the foreground on a low hill. Not an exact copy of any game asset.

Palette strictly cold and neutral: background #060607, silhouettes #0D0F10 to #1A1C1E, fog no brighter than #34383C. No orange, red, fire, lit windows, moon or colored sky.

Style: painterly dark fantasy matte painting, crisp silhouettes with fine architectural detail (pointed arches, buttresses, broken roofs), soft fog layers between the planes for depth, sharp focus, high definition. No film grain, no noise, no JPEG artifacts.

Exclusions: no text, letters, runes, logos, watermarks or signatures; no characters, creatures or faces; no UI.

Produce 2 variants, one image_gen call each:
A: as described.
B: the same with more fog and fewer buildings, the cathedral in the left third the main landmark.
```

## banner.webp

- Output: rows y 115-657 of the 2172x724 source, WebP q85 method 6, 134,404 bytes, sha256 `68cdbdf2c6665ba3e1e7c090d80fb3f11fe75262555eabe990b5a049d58ec9c0`. The crop starts at y 115 so that Diablo's eyes sit above the portrait panel: at 1440 px they show in full; at 2560 px they touch the panel's top edge.
- Display: `fetchpriority="high"`, not lazy, `mask-b-from-30%`, over the CSS `ember-glow`, which carries the fire down behind the first panels and stands in while the image loads; a radial scrim and text halos keep the navbar and the page title readable.
- One run, 3 variants (A burning gothic city, B Chaos Sanctuary, C cathedral with Diablo in the smoke); A kept by the user:

```
View these images first:
- banner-v1.png: the current header banner of a Diablo II fan calculator web app. The idea is approved (burning gothic city, a horned demon face looming in the fire, fade to near-black), but it is too low resolution and the demon is too generic.
- site-1440.png: the site at 1440 px with that banner behind the header.
- concept-1.png: the approved art direction (palette, mood).

Generate a new header banner, much higher definition and much closer to the Diablo II universe. It is fan art: the face is Diablo himself, the Lord of Terror.

Canvas: 3840x1280 (3:1 landscape). Request that exact size from image_gen. If the tool cannot do 3840x1280, use the largest 3:1 or widest landscape size it supports, and report the size you got.

Layout (the site crops this image to a wide strip; the coordinates are for 3840x1280):
- The scene fills y 0 to about 760. From y 600 to y 820 everything fades smoothly to flat #060607, with no hard edge and no horizon line. Below y 820 the canvas is flat #060607.
- Left part, x 0 to 1700: ruined and burning gothic architecture of Sanctuary as dark silhouettes against fire and red smoke. The zone x 850-1650, y 50-300 stays dark (no brighter than about #3A1A12): a pale title sits there.
- Right of center, x 2200 to 3300: Diablo's head, huge, looming out of fire and smoke above the city, as in a Blizzard cinematic matte painting. Recognizable Diablo: crimson-red demonic skin, the crest of bony spikes along the top and back of the head, the two great backward-curving horns, deep brow ridges, glowing yellow-orange eyes at about y 280-380, a fanged open maw that dissolves into the flames below. The top edge of the canvas may cut the tips of the horns and crest. The head is rendered with real detail and sharp edges on the eyes, horns and spikes, and it melts into smoke at its edges and jaw.
- Far right, x 3300-3840: more burning towers, dim.
- A small button sits at about x 2600-3250, y 100-200: keep that zone mid-dark (horns or smoke, no bright fire).

Style: painterly dark fantasy matte painting, Diablo II: Resurrected cinematic mood, crisp silhouettes, rich detail, sharp focus, high definition. Infernal palette: deep blood red, ember orange, charcoal shadows #1E0D0B to #2A120E. Fire peaks around #C8602E; only Diablo's eyes may reach a bright #FFB040. Drifting ember sparks in the upper half. No film grain, no noise, no JPEG artifacts.

Exclusions: no text, letters, runes, logos, watermarks or signatures; no Blizzard logo, no Diablo game logo; no UI; no humans, no weapons.

Produce 3 variants, one image_gen call each:
A: as described, the burning gothic city of Sanctuary on the left and center, Diablo's head right of center.
B: Hell instead of the city: the Chaos Sanctuary, obsidian spires, rivers of lava and black stone bridges on the left and center, Diablo's head right of center, larger.
C: a burning gothic cathedral (Tristram's cathedral mood, not an exact copy of any game asset) on the left, a burning town in the center, Diablo's head right of center, fainter, as if formed by the smoke and fire, but his eyes, horns and crest still read at a glance.
```

## logo.svg, favicon.svg, favicon-32.png, apple-touch-icon.png, og.png

- No image generator: an AI coding agent wrote the SVG paths on 2026-10-01, and the user chose the variant on a board of 36 combinations (4 letter shapes, 3 fills, 3 frames). The mark is "DII" in the barbed style, gold fill, no frame; "LAB" stays text in Cinzel.
- Blizzard's Logo and Trademark Guidelines forbid altering a Blizzard logo or pairing a Blizzard mark with another name ("Acme Warcraft"), so the mark is an original drawing, not the D2R logo.
- `logo.svg`: `viewBox="0 0 114 64"`, one evenodd path (D and two I) with a `#EDC440`-`#FA9D11`-`#E8610D` gradient and a `#9A2404` stroke. The navbar shows it at 20 px high, followed by "Lab" in uppercase Cinzel.
- `favicon.svg`: the same path, scaled by 0.5614 and centred in `viewBox="0 0 64 64"`.
- `favicon-32.png`: `rsvg-convert -w 32 -h 32 public/favicon.svg -o public/favicon-32.png`.
- `apple-touch-icon.png`: `rsvg-convert -w 148 public/logo.svg -o mark.png`, then `magick -size 180x180 xc:'#060607' mark.png -gravity center -composite -strip public/apple-touch-icon.png`.
- `og.png`: 1200x630, `art/og.html` ("DII LAB", a rule, "Diablo 2 tools and laboratory") rendered in Chromium from the repo root:

```
bun -e 'import { chromium } from "playwright"; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 } }); await p.goto(`file://${process.cwd()}/apps/ias/art/og.html`); await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: "apps/ias/public/og.png" }); await b.close();'
```
