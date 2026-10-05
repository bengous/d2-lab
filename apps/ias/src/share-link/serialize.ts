import type { SerializeShareLink } from "@/contracts/share-link";
import { normalize } from "@/engine/normalize";
import { shareLinkVersion, shareParams, versionParam } from "@/share-link/params";

/**
 * The search string of `normalize(build)`, starting with `?`. Only the parameters that differ from
 * the default build are written, in the order of `shareParams`. A number outside its field's
 * bounds has no valid link: parsing the result reports it as `out-of-range`.
 */
export const serializeShareLink: SerializeShareLink = (build) => {
  const normalized = normalize(build);

  const entries = shareParams.flatMap((param) => {
    const text = param.emit(normalized);

    return text === undefined ? [] : [[param.name, text] as const];
  });

  const query = new URLSearchParams(
    Object.fromEntries([[versionParam, shareLinkVersion], ...entries]),
  );

  return `?${query.toString()}`;
};
