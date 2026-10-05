# d2-dcc

Decoder of DCC files, the compressed sprite frames of the legacy Diablo II graphics: one layer component, one mode and weapon class, every direction.

## Origin and license

A TypeScript port of `d2common/d2fileformats/d2dcc` from [OpenDiablo2](https://github.com/OpenDiablo2/OpenDiablo2) at commit `7f92c571bf04057a7fbdfb5d25a486f7d775e3c3`, with the bit reader of `d2common/d2datautils`. OpenDiablo2 is GPL-3.0, so this package is too: `LICENSE` is the upstream file. The rest of the repo imports it by path, from the build tools only (`apps/ias/scripts/sprites/`); no browser bundle includes it.

| File              | Ports                                                               |
| ----------------- | ------------------------------------------------------------------- |
| `bit-reader.ts`   | `d2datautils/bitmuncher.go`                                         |
| `dcc.ts`          | `dcc.go`, `dcc_direction.go`: header, frame headers, streams, cells |
| `pixel-buffer.ts` | `dcc_direction.go`, `fillPixelBuffer`                               |
| `frames.ts`       | `dcc_direction.go`, `generateFrames`                                |
| `directions.ts`   | `dcc_dir_lookup.go`: the DCC direction of each of the game's 64     |

## Use

```ts
import { decodeDirection, readDcc } from "../../tools/d2-dcc/dcc";
import { dccDirection } from "../../tools/d2-dcc/directions";

const file = readDcc(bytes);
const { box, frames } = decodeDirection(file, dccDirection(4, file.directionCount));
```

Each frame holds one palette index per pixel of `box`, row after row; index 0 is transparent.

## Oracle

`oracle/` is a Go program that decodes the same files with the upstream package, pinned in `oracle/go.mod`. `oracle.ts` compares both, direction by direction: box, frame count, sha256 of the frames. It needs Go and the game files, so it stays out of `bun test` and CI:

```sh
bun run dcc:oracle ~/.cache/d2r-data/3.3.93847-sprites/files/data/data/global/chars
```

On D2R 3.3.93847: 16089 files, 257304 directions, 0 mismatches, in about 2 min 20 s. `bun run assets:extract` fills that cache.
