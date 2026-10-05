import type { Page } from "playwright";

export type OriginalFrameData = number | readonly number[];

/** One entry of `weaponsMap`, with `type` as its key in `wt` and `itemClass` as its `ic` value. */
export interface OriginalWeapon {
  readonly name: string;
  readonly wsm: number;
  readonly type: string;
  readonly itemClass: string;
}

export interface OriginalConstants {
  readonly weapons: readonly OriginalWeapon[];
  /** `wt.*.frameData`, keyed by `wt` key, then by the `char` value. */
  readonly frames: Readonly<Record<string, Readonly<Record<string, OriginalFrameData>>>>;
}

interface OriginalWeaponType {
  readonly frameData: ReadonlyMap<number, OriginalFrameData>;
}

interface OriginalWeaponModule {
  readonly name: string;
  readonly WSM: number;
  readonly type: OriginalWeaponType;
  readonly itemClass: string;
}

interface OriginalConstantsModule {
  readonly wt: Readonly<Record<string, OriginalWeaponType>>;
  readonly weaponsMap: ReadonlyMap<string, OriginalWeaponModule>;
}

/** Imports `constants.js` in a served page of Warren's calculator: it touches `document` at load. */
// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Playwright's Page is a mutable class
export function readOriginalConstants(page: Page): Promise<OriginalConstants> {
  return page.evaluate(async (specifier) => {
    // SAFETY: constants.js@bcc112d exports `wt` and `weaponsMap` with these shapes (constants.js:184-227, 369-500).
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- import() of a runtime specifier is typed any
    const original = (await import(specifier)) as OriginalConstantsModule;
    const typeNames = new Map<OriginalWeaponType, string>();
    const frames: Record<string, Record<string, OriginalFrameData>> = {};

    for (const name of Object.keys(original.wt)) {
      const type = original.wt[name];

      if (type === undefined) {
        throw new Error(`wt.${name} is undefined`);
      }

      typeNames.set(type, name);
      frames[name] = Object.fromEntries(type.frameData);
    }

    const weapons = [...original.weaponsMap.values()].map((weapon) => {
      const type = typeNames.get(weapon.type);

      if (type === undefined) {
        throw new Error(`weapon ${weapon.name} has a type outside wt`);
      }

      return { name: weapon.name, wsm: weapon.WSM, type, itemClass: weapon.itemClass };
    });

    return { weapons, frames };
  }, "/constants.js");
}
