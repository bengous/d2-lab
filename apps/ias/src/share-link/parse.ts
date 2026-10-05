import type { Build } from "@/contracts/build";
import type { InputSpec } from "@/contracts/inputs";
import type { ParseShareLink } from "@/contracts/share-link";
import { availableInputs } from "@/engine/available-inputs";
import { defaultBuild } from "@/engine/default-build";
import { normalize } from "@/engine/normalize";
import {
  type ApplyFailure,
  type ShareParam,
  shareLinkVersion,
  shareParams,
  unknownValue,
  versionParam,
} from "@/share-link/params";

/** The build so far, with its form while no select has changed since it was computed. */
interface Progress {
  readonly build: Build;
  readonly form: InputSpec | undefined;
}

type Step = { readonly ok: true; readonly progress: Progress } | ApplyFailure;

const knownNames: ReadonlySet<string> = new Set([
  versionParam,
  ...shareParams.map((param) => param.name),
]);

function applyParam(progress: Progress, param: ShareParam, query: URLSearchParams): Step {
  const [raw, repeated] = query.getAll(param.name);

  if (raw === undefined) {
    return { ok: true, progress };
  }

  if (repeated !== undefined) {
    return unknownValue(param.name, repeated);
  }

  if (param.edits === "select") {
    const applied = param.apply(progress.build, raw);

    return applied.ok ? { ok: true, progress: { build: applied.build, form: undefined } } : applied;
  }

  const form = progress.form ?? availableInputs(progress.build);

  if (!form.fields.has(param.edits)) {
    return unknownValue(param.name, raw);
  }

  const applied = param.apply(progress.build, raw, form);

  return applied.ok ? { ok: true, progress: { build: applied.build, form } } : applied;
}

/**
 * Reads a share link's query string. The first error wins: the version, then each parameter in
 * the order of `shareParams`, then a parameter name nothing defines. A repeated parameter is an
 * `unknown-value` on its second occurrence, and so is a parameter for a field the form hides.
 */
export const parseShareLink: ParseShareLink = (search) => {
  const query = new URLSearchParams(search);
  const [version, repeatedVersion] = query.getAll(versionParam);

  if (version !== shareLinkVersion) {
    return { ok: false, error: { kind: "unsupported-version", version: version ?? "" } };
  }

  if (repeatedVersion !== undefined) {
    return unknownValue(versionParam, repeatedVersion);
  }

  const applied = shareParams.reduce<Step>(
    (step, param) => (step.ok ? applyParam(step.progress, param, query) : step),
    { ok: true, progress: { build: defaultBuild, form: undefined } },
  );

  if (!applied.ok) {
    return applied;
  }

  const entries: readonly (readonly [string, string])[] = [...query];
  const unknown = entries.find(([name]) => !knownNames.has(name));

  if (unknown !== undefined) {
    const [param, value] = unknown;

    return unknownValue(param, value);
  }

  return { ok: true, build: normalize(applied.progress.build) };
};
