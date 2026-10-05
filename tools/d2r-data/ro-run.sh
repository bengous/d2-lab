#!/bin/sh
# Runs a command with the D2R install bind-mounted read-only inside a private
# user namespace, so nothing the command does can write to the install.
set -eu
[ $# -ge 2 ] || { echo "usage: $0 <install dir> <command>..." >&2; exit 2; }
INSTALL=$1
shift
[ -f "$INSTALL/.build.info" ] || { echo "no .build.info in $INSTALL" >&2; exit 1; }
exec unshare -rm sh -c 'mount --bind "$0" "$0" && mount -o remount,bind,ro "$0" && exec "$@"' "$INSTALL" "$@"
