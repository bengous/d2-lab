"""Derive FCR, FHR and FBR breakpoints from animdata.tsv and compare them with published tables.

Published rows: https://michaelangel007.github.io/d2_cheat_sheet/
Formulas: FCR from https://mannm.org/d2library/faqtoids/fcr_eng.html,
FHR from https://diablo.fandom.com/wiki/Faster_Hit_Recovery,
FBR base 50 (100 under Holy Shield) from https://www.lurkerlounge.com/forums/thread-11026-post-16794.html
"""

import csv
import math
import sys

FCR_CAP = 75
NO_CAP = 10**6

PUBLISHED = [
    ("FCR", "AMSCHTH", 100, FCR_CAP, [0, 7, 14, 22, 32, 48, 68, 99, 152]),
    ("FCR", "AISCHTH", 100, FCR_CAP, [0, 8, 16, 27, 42, 65, 102, 174]),
    ("FCR", "BASCHTH", 100, FCR_CAP, [0, 9, 20, 37, 63, 105, 200]),
    ("FCR", "DZSCHTH", 100, FCR_CAP, [0, 4, 10, 19, 30, 46, 68, 99, 163]),
    ("FCR", "TGSCHTH", 100, FCR_CAP, [0, 7, 15, 26, 40, 63, 99, 163]),
    ("FCR", "40SCHTH", 100, FCR_CAP, [0, 6, 14, 26, 40, 60, 95, 157]),
    ("FCR", "NESCHTH", 100, FCR_CAP, [0, 9, 18, 30, 48, 75, 125]),
    ("FCR", "PASCHTH", 100, FCR_CAP, [0, 9, 18, 30, 48, 75, 125]),
    ("FCR", "SOSCHTH", 100, FCR_CAP, [0, 9, 20, 37, 63, 105, 200]),
    ("FCR", "WKSCHTH", 100, FCR_CAP, [0, 9, 18, 30, 48, 75, 125]),
    ("FHR", "AMGHHTH", 50, NO_CAP, [0, 6, 13, 20, 32, 52, 86, 174, 600]),
    ("FHR", "AIGHHTH", 50, NO_CAP, [0, 7, 15, 27, 48, 86, 200]),
    ("FHR", "BAGHHTH", 50, NO_CAP, [0, 7, 15, 27, 48, 86, 200]),
    ("FHR", "DZGH1HS", 50, NO_CAP, [0, 3, 7, 13, 19, 29, 42, 63, 99, 174, 456]),
    ("FHR", "DZGHHTH", 50, NO_CAP, [0, 5, 10, 16, 26, 39, 56, 86, 152, 377]),
    ("FHR", "TGGHHTH", 50, NO_CAP, [0, 5, 10, 16, 24, 37, 54, 86, 152, 360]),
    ("FHR", "40GHHTH", 50, NO_CAP, [0, 9, 20, 42, 86, 280]),
    ("FHR", "NEGHHTH", 50, NO_CAP, [0, 5, 10, 16, 26, 39, 56, 86, 152, 377]),
    ("FHR", "PAGHSTF", 50, NO_CAP, [0, 3, 7, 13, 20, 32, 48, 75, 129, 280]),
    ("FHR", "PAGHHTH", 50, NO_CAP, [0, 7, 15, 27, 48, 86, 200]),
    ("FHR", "SOGHHTH", 50, NO_CAP, [0, 5, 9, 14, 20, 30, 42, 60, 86, 142, 280]),
    ("FHR", "WKGHHTH", 50, NO_CAP, [0, 5, 10, 16, 26, 39, 56, 86, 152, 377]),
    ("FBR", "AMBL1HS", 50, NO_CAP, [0, 4, 6, 11, 15, 23, 29, 40, 56, 80, 120, 200, 480]),
    ("FBR", "AMBLHTH", 50, NO_CAP, [0, 13, 32, 86, 600]),
    ("FBR", "AIBLHTH", 50, NO_CAP, [0, 13, 32, 86, 600]),
    ("FBR", "BABLHTH", 50, NO_CAP, [0, 9, 20, 42, 86, 280]),
    ("FBR", "DZBLHTH", 50, NO_CAP, [0, 6, 13, 20, 32, 52, 86, 174, 600]),
    ("FBR", "TGBLHTH", 50, NO_CAP, [0, 7, 15, 27, 48, 86, 200]),
    ("FBR", "40BLHTH", 50, NO_CAP, [0, 5, 10, 16, 27, 40, 65, 109, 223]),
    ("FBR", "NEBLHTH", 50, NO_CAP, [0, 6, 13, 20, 32, 52, 86, 174, 600]),
    ("FBR", "PABLHTH", 50, NO_CAP, [0, 13, 32, 86, 600]),
    ("FBR", "PABLHTH", 100, NO_CAP, [0, 86]),
    ("FBR", "SOBLHTH", 50, NO_CAP, [0, 7, 15, 27, 48, 86, 200]),
    ("FBR", "WKBLHTH", 50, NO_CAP, [0, 6, 13, 20, 32, 52, 86]),
]


def frames(fpd: int, speed: int, base: int, bonus: int, cap: int) -> int:
    effective = min(bonus * 120 // (bonus + 120), cap)
    return math.ceil(256 * fpd / (speed * (base + effective) // 100)) - 1


def breakpoints(fpd: int, speed: int, base: int, cap: int, upto: int) -> list[int]:
    found, previous = [0], frames(fpd, speed, base, 0, cap)
    for bonus in range(1, upto + 1):
        current = frames(fpd, speed, base, bonus, cap)
        if current < previous:
            found.append(bonus)
            previous = current
    return found


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(f"usage: {sys.argv[0]} <animdata.tsv>")
    records: dict[str, tuple[int, int]] = {}
    with open(sys.argv[1], newline="") as f:
        for row in csv.DictReader(f, delimiter="\t"):
            records.setdefault(row["cof"], (int(row["frames_per_direction"]), int(row["anim_speed"])))

    matched = 0
    for stat, cof, base, cap, published in PUBLISHED:
        fpd, speed = records[cof]
        derived = breakpoints(fpd, speed, base, cap, published[-1])
        if derived == published:
            matched += 1
        else:
            print(f"DIFF\t{stat}\t{cof}\tbase {base}\tderived {derived}\tpublished {published}")
    print(f"{matched}/{len(PUBLISHED)} published rows reproduced")


if __name__ == "__main__":
    main()
