#!/bin/sh
set -eu
[ $# -ge 2 ] || { echo "usage: $0 <install dir> <out dir> [extra CASC mask]..." >&2; exit 2; }
KIT=$(cd "$(dirname "$0")" && pwd)
INSTALL=$1
OUT=$2
shift 2

[ -f "$INSTALL/.build.info" ] || { echo "no .build.info in $INSTALL" >&2; exit 1; }
if [ -e "$OUT" ] && [ -n "$(ls -A "$OUT")" ]; then
    echo "out dir $OUT is not empty; remove it first so two game versions never mix" >&2
    exit 1
fi
[ -x "$KIT/build/casc-cli" ] || "$KIT/build.sh" >/dev/null

VERSION=$(awk -F'|' 'NR==1{for(i=1;i<=NF;i++) if($i ~ /^Version!/) c=i} NR==2 && c{print $c}' "$INSTALL/.build.info")
[ -n "$VERSION" ] || { echo "no Version column in $INSTALL/.build.info" >&2; exit 1; }

casc() { "$KIT/ro-run.sh" "$INSTALL" "$KIT/build/casc-cli" "$INSTALL" "$@"; }

mkdir -p "$OUT"
casc list '*' > "$OUT/listing.tsv"
casc extract "$OUT/files" \
    'data:data\global\excel\*.txt' \
    'data:data\global\*animdata.d2' \
    'data:data\local\lng\strings\*.json' \
    'data:data\hd\global\ui\spells\*skillicon.sprite' \
    'data:data\hd\global\ui\hireables\*icon.sprite' \
    'data:data\hd\global\ui\items\weapon\*.sprite' \
    'data:data\hd\items\items.json' \
    "$@" > "$OUT/extracted.tsv"

UI="$OUT/files/data/data/hd/global/ui"
python3 "$KIT/sprite2png.py" "$OUT/png/skillicons" "$UI"/spells/*/*skillicon.sprite >/dev/null
python3 "$KIT/sprite2png.py" "$OUT/png/hireables" "$UI"/hireables/*icon.sprite >/dev/null
find "$UI/items/weapon" -name '*.sprite' ! -name '*.lowend.sprite' -exec python3 "$KIT/sprite2png.py" "$OUT/png/weapons" {} + >/dev/null
python3 "$KIT/animdata.py" "$OUT/files/data/data/global/animdata.d2" > "$OUT/animdata.tsv"
echo "$VERSION" > "$OUT/VERSION"
echo "$VERSION	$OUT"
