#!/bin/sh
set -eu
cd "$(dirname "$0")"

CASCLIB_COMMIT=38a34665624b8775bb875274b36191b21c38d97b
SRC=build/CascLib

if [ ! -d "$SRC" ]; then
    git init -q "$SRC"
    git -C "$SRC" fetch -q --depth 1 https://github.com/ladislav-zezula/CascLib.git "$CASCLIB_COMMIT"
    git -C "$SRC" checkout -q FETCH_HEAD
    # CascLib opens .build.info read-write; the read-only mount of ro-run.sh would refuse it.
    git -C "$SRC" apply ../../casclib-readonly.patch
fi

# LPDWORD is undefined on Linux at this commit (src/CascFiles.cpp:525).
# CMake 4 rejects the cmake_minimum_required(VERSION 3.2) of CascLib without the policy override.
cmake -Wno-deprecated -S "$SRC" -B "$SRC/build" -DCASC_BUILD_SHARED_LIB=OFF -DCASC_BUILD_STATIC_LIB=ON \
    -DCMAKE_BUILD_TYPE=Release -DCMAKE_POLICY_VERSION_MINIMUM=3.5 '-DCMAKE_CXX_FLAGS=-DLPDWORD=PDWORD' >/dev/null
cmake --build "$SRC/build" -j"$(nproc)" >/dev/null
g++ -O2 -std=c++17 -DLPDWORD=PDWORD -I"$SRC/src" casc-cli.cpp "$SRC/build/libcasc.a" -lz -o build/casc-cli
echo build/casc-cli
