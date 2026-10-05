"""Convert D2R HD .sprite files (SpA1 version 31, raw RGBA8) to one PNG per frame."""

import struct
import sys
import zlib
from pathlib import Path

HEADER_SIZE = 40
SUPPORTED_VERSION = 31


def read_sprite(path: Path) -> tuple[int, int, int, bytes]:
    data = path.read_bytes()
    magic = data[:4]
    version, _visible_width, width, height = struct.unpack_from("<HHII", data, 4)
    (frames,) = struct.unpack_from("<I", data, 20)
    (pixel_bytes,) = struct.unpack_from("<I", data, 32)
    if magic != b"SpA1" or version != SUPPORTED_VERSION:
        raise ValueError(f"{path}: magic {magic!r} version {version}, expected SpA1 v{SUPPORTED_VERSION}")
    if pixel_bytes != width * height * 4 or len(data) != HEADER_SIZE + pixel_bytes:
        raise ValueError(f"{path}: {len(data)} bytes does not match {width}x{height} RGBA8")
    if width % frames:
        raise ValueError(f"{path}: width {width} is not a multiple of {frames} frames")
    return width, height, frames, data[HEADER_SIZE:]


def png_bytes(width: int, height: int, rows: list[bytes]) -> bytes:
    def chunk(tag: bytes, body: bytes) -> bytes:
        return struct.pack(">I", len(body)) + tag + body + struct.pack(">I", zlib.crc32(tag + body))

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(b"".join(b"\x00" + row for row in rows), 9)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


def convert(path: Path, out_dir: Path) -> list[Path]:
    width, height, frames, pixels = read_sprite(path)
    cell = width // frames
    stem = path.name.removesuffix(".sprite")
    written = []
    for frame in range(frames):
        rows = [pixels[(y * width + frame * cell) * 4:(y * width + (frame + 1) * cell) * 4] for y in range(height)]
        target = out_dir / (f"{stem}.png" if frames == 1 else f"{stem}_{frame:02d}.png")
        target.write_bytes(png_bytes(cell, height, rows))
        written.append(target)
    return written


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit(f"usage: {sys.argv[0]} <out dir> <file.sprite>...")
    out_dir = Path(sys.argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    for name in sys.argv[2:]:
        written = convert(Path(name), out_dir)
        print(f"{len(written)}\t{name}")


if __name__ == "__main__":
    main()
