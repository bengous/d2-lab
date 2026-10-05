import type { Build } from "@/contracts/build";
import { originalInitialState } from "@/data/rules/default-build";
import { normalize } from "@/engine/normalize";

/** What a link without parameters loads, and the value a share link omits. */
export const defaultBuild: Build = normalize(originalInitialState.build);
