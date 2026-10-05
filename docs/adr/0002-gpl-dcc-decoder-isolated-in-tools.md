# The GPL DCC decoder lives apart, in tools/d2-dcc

The only decoder proven on D2R's DCC files is OpenDiablo2's, GPL-3.0 and archived since 2021. We ported it to TypeScript in `tools/d2-dcc/`, with its own GPL-3.0 `LICENSE` and its origin in `README.md`, and only the extraction scripts (`apps/ias/scripts/`) import it: it runs on the maintainer's machine, so the site distributes images, never GPL code. `bun run dcc:oracle` checks the port against the Go decoder (16,089 files, no difference).

## Considered options

- **Our own decoder from the format description**: no GPL line in the repository, but slower and riskier; the OpenDiablo2/dcc rewrite of the same format loses cells on D2R files. Written by someone who had read OpenDiablo2, it would not have been a clean-room work anyway.
- **The Go decoder as is**, fetched at a pinned commit: no port, but Go becomes a requirement of `assets:extract`.
- **The Go decoder in WebAssembly**: 741 KB gzipped against 2 KB for the TypeScript port, and still GPL code shipped to visitors.

## Consequences

- `apps/ias/src/` must never import `tools/d2-dcc/` (`.claude/rules/ias-data.md`). Decoding in the browser later would make the site's code GPL: decide that explicitly first.
- The repository is under the MIT License, except `tools/d2-dcc/`, which stays GPL-3.0 with its own `LICENSE`. The COF reader (`apps/ias/scripts/sprites/cof.ts`) is ours: OpenDiablo2/cof has no license.
