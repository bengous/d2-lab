import { join } from "node:path";

import type { CharacterId } from "@/contracts/build";
import type {
  ItemClass,
  WeaponClass,
  WeaponData,
  WeaponItem,
  WeaponTier,
} from "@/contracts/game-data";

import {
  cell,
  readStrings,
  readTable,
  required,
  slugify,
  type GameCache,
  type Row,
} from "./game-files";

/** `WeaponData` before its id is branded: the generated file brands it. */
export type ExtractedWeapon = Omit<WeaponData, "id"> & { readonly id: string };

/** `playerclass.txt` codes, as used by the `Class` column of `itemtypes.txt`. */
const classCodes: ReadonlyMap<string, CharacterId> = new Map([
  ["ama", "amazon"],
  ["ass", "assassin"],
  ["bar", "barbarian"],
  ["dru", "druid"],
  ["nec", "necromancer"],
  ["pal", "paladin"],
  ["sor", "sorceress"],
  ["war", "warlock"],
]);

/** `2handedwclass` of `weapons.txt`: the animation class of a weapon held the way the game swings it. */
const animationClasses: ReadonlyMap<string, WeaponClass> = new Map([
  ["1hs", "1hs"],
  ["1ht", "1ht"],
  ["2hs", "2hs"],
  ["2ht", "2ht"],
  ["stf", "stf"],
  ["bow", "bow"],
  ["xbw", "xbw"],
  ["ht1", "ht"],
]);

/** `type` of `weapons.txt` to the item classes of Warren's calculator (`constants.js:484-498`). */
const itemClasses: ReadonlyMap<string, ItemClass> = new Map([
  ["axe", "axe"],
  ["knif", "dagger"],
  ["pole", "polearm"],
  ["jave", "javelin"],
  ["ajav", "javelin"],
  ["spea", "spear"],
  ["aspe", "spear"],
  ["swor", "sword"],
  ["mace", "mace"],
  ["club", "mace"],
  ["hamm", "mace"],
  ["scep", "mace"],
  ["bow", "missile"],
  ["abow", "missile"],
  ["xbow", "missile"],
  ["staf", "staff"],
  ["wand", "staff"],
  ["orb", "orb"],
  ["h2h", "claw"],
  ["h2h2", "claw"],
  ["tkni", "throwing"],
  ["taxe", "throwing"],
]);

/** The `weapons.txt` column that holds the code of each tier of a family. */
const tierColumns: readonly (readonly [string, WeaponTier])[] = [
  ["normcode", "normal"],
  ["ubercode", "exceptional"],
  ["ultracode", "elite"],
];

/** Throwing potions: `weapons.txt` rows that are not weapon bases. */
const throwingPotionType = "tpot";

const unarmed: ExtractedWeapon = {
  id: "unarmed",
  code: "",
  name: "None",
  wsm: 0,
  weaponClass: "hth",
  itemClass: "none",
  twoHanded: false,
  oneOrTwoHanded: false,
  restrictedTo: null,
  itemTypes: [],
  maxSockets: 0,
  item: null,
  graphic: null,
};

/** The lookups `toWeapon` reads, one per game file. */
interface WeaponTables {
  readonly names: ReadonlyMap<string, string>;
  readonly restrictions: ReadonlyMap<string, CharacterId>;
  readonly parents: ReadonlyMap<string, readonly string[]>;
  /** Item code to the basename of its HD sprite. */
  readonly icons: ReadonlyMap<string, string>;
}

/** The `Expansion` separator row has no code; quest items have a `quest` number. */
function isWeaponBase(row: Row): boolean {
  const quest = cell(row, "quest");

  return (
    cell(row, "code") !== "" &&
    (quest === "" || quest === "0") &&
    cell(row, "type") !== throwingPotionType
  );
}

function integerCell(row: Row, column: string, code: string): number {
  const text = cell(row, column);
  const value = text === "" ? 0 : Number(text);

  if (!Number.isInteger(value)) {
    throw new TypeError(`weapons.txt ${code}: ${column} "${text}" is not an integer`);
  }

  return value;
}

function classRestrictions(itemTypes: readonly Row[]): ReadonlyMap<string, CharacterId> {
  const restrictions = new Map<string, CharacterId>();

  for (const row of itemTypes) {
    const classCode = cell(row, "Class");

    if (classCode !== "") {
      restrictions.set(
        cell(row, "Code"),
        required(classCodes.get(classCode), `itemtypes.txt: unknown Class ${classCode}`),
      );
    }
  }

  return restrictions;
}

function typeParents(itemTypes: readonly Row[]): ReadonlyMap<string, readonly string[]> {
  return new Map(
    itemTypes.map((row) => [
      cell(row, "Code"),
      [cell(row, "Equiv1"), cell(row, "Equiv2")].filter((parent) => parent !== ""),
    ]),
  );
}

/** The type, then every type it counts as, breadth first. */
function typeAncestry(
  type: string,
  parents: ReadonlyMap<string, readonly string[]>,
): readonly string[] {
  const ancestry = [type];

  for (const code of ancestry) {
    for (const parent of required(parents.get(code), `itemtypes.txt has no ${code}`)) {
      if (!ancestry.includes(parent)) {
        ancestry.push(parent);
      }
    }
  }

  return ancestry;
}

/** One entry of `hd/items/items.json`: an item code to its asset, `<folder>/<basename>`. */
type IconEntry = Readonly<Record<string, { readonly asset: string }>>;

function isAsset(value: unknown): value is { readonly asset: string } {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return typeof new Map(Object.entries(value)).get("asset") === "string";
}

function isIconEntry(value: unknown): value is IconEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.values(value).every((field) => isAsset(field));
}

/** Reads `hd/items/items.json` into a map from item code to the basename of its HD sprite. */
async function readIcons(path: string): Promise<ReadonlyMap<string, string>> {
  const entries: unknown = await Bun.file(path).json();

  if (!Array.isArray(entries) || !entries.every((entry) => isIconEntry(entry))) {
    throw new TypeError(`${path}: expected an array of { <code>: { asset } }`);
  }

  const icons = new Map<string, string>();
  const assetsByBasename = new Map<string, string>();

  for (const [code, { asset }] of entries.flatMap((entry) => Object.entries(entry))) {
    const basename = required(asset.split("/").at(-1), `${path}: ${code} has an empty asset`);
    const known = assetsByBasename.get(basename);

    if (known !== undefined && known !== asset) {
      throw new Error(`${path}: ${known} and ${asset} share the icon file name ${basename}`);
    }

    assetsByBasename.set(basename, asset);
    icons.set(code, basename);
  }

  return icons;
}

function tierOf(row: Row, code: string): WeaponTier {
  const found = tierColumns.find(([column]) => cell(row, column) === code);

  return required(found, `weapons.txt ${code}: not its own normcode, ubercode or ultracode`)[1];
}

function toItem(row: Row, index: number, icons: ReadonlyMap<string, string>): WeaponItem {
  const code = cell(row, "code");

  return {
    tier: tierOf(row, code),
    family: cell(row, "normcode"),
    row: index + 1,
    icon: required(icons.get(code), `items.json has no icon for ${code}`),
  };
}

function toWeapon(row: Row, index: number, tables: WeaponTables): ExtractedWeapon {
  const { names, restrictions, parents, icons } = tables;
  const code = cell(row, "code");
  const type = cell(row, "type");
  const name = required(names.get(code), `item-names.json has no ${code}`);
  const animationClass = cell(row, "2handedwclass");

  return {
    id: slugify(name),
    code,
    name,
    wsm: integerCell(row, "speed", code),
    weaponClass: required(
      animationClasses.get(animationClass),
      `weapons.txt ${code}: unknown 2handedwclass ${animationClass}`,
    ),
    itemClass: required(itemClasses.get(type), `weapons.txt ${code}: unknown type ${type}`),
    twoHanded: cell(row, "2handed") === "1",
    oneOrTwoHanded: cell(row, "1or2handed") === "1",
    restrictedTo: restrictions.get(type) ?? null,
    itemTypes: typeAncestry(type, parents),
    maxSockets: integerCell(row, "gemsockets", code),
    item: toItem(row, index, icons),
    graphic: cell(row, "alternategfx"),
  };
}

function compareIds(left: ExtractedWeapon, right: ExtractedWeapon): number {
  if (left.id === right.id) {
    return 0;
  }

  return left.id < right.id ? -1 : 1;
}

export async function extractWeapons(cache: GameCache): Promise<readonly ExtractedWeapon[]> {
  const gameDir = join(cache.dir, "files/data/data");
  const weaponRows = await readTable(join(gameDir, "global/excel/weapons.txt"), [
    "code",
    "type",
    "speed",
    "2handedwclass",
    "1or2handed",
    "2handed",
    "quest",
    "gemsockets",
    "normcode",
    "ubercode",
    "ultracode",
  ]);

  const itemTypes = await readTable(join(gameDir, "global/excel/itemtypes.txt"), [
    "Code",
    "Equiv1",
    "Equiv2",
    "Class",
  ]);

  const tables: WeaponTables = {
    names: await readStrings(join(gameDir, "local/lng/strings/item-names.json")),
    restrictions: classRestrictions(itemTypes),
    parents: typeParents(itemTypes),
    icons: await readIcons(join(gameDir, "hd/items/items.json")),
  };

  const weapons = weaponRows
    .flatMap((row, index) => (isWeaponBase(row) ? [toWeapon(row, index, tables)] : []))
    .toSorted(compareIds);

  const collisions = weapons.filter(
    (weapon, index) => weapon.id === unarmed.id || weapons[index - 1]?.id === weapon.id,
  );

  if (collisions.length > 0) {
    throw new Error(`weapon ids collide: ${collisions.map((weapon) => weapon.id).join(", ")}`);
  }

  return [unarmed, ...weapons];
}
