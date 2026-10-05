"""Dump animdata.d2 as TSV: cof, frames per direction, animation speed, flagged frames (index=flag)."""

import struct
import sys
from pathlib import Path

BLOCKS = 256
RECORD_SIZE = 160
FLAG_OFFSET = 16


def records(data: bytes):
    offset = 0
    for _ in range(BLOCKS):
        (count,) = struct.unpack_from("<I", data, offset)
        offset += 4
        for _ in range(count):
            name = data[offset:offset + 8].split(b"\0")[0].decode("ascii")
            frames, speed = struct.unpack_from("<II", data, offset + 8)
            flags = data[offset + FLAG_OFFSET:offset + RECORD_SIZE]
            yield name, frames, speed, [(i, f) for i, f in enumerate(flags[:frames]) if f]
            offset += RECORD_SIZE
    if offset != len(data):
        raise ValueError(f"parsed {offset} of {len(data)} bytes")


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(f"usage: {sys.argv[0]} <animdata.d2>")
    print("cof\tframes_per_direction\tanim_speed\tflagged_frames")
    for name, frames, speed, flagged in records(Path(sys.argv[1]).read_bytes()):
        print(f"{name}\t{frames}\t{speed}\t{','.join(f'{i}={f}' for i, f in flagged)}")


if __name__ == "__main__":
    main()
