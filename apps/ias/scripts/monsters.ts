import { join } from "node:path";

import type {
  AnimationFrames,
  AnimationName,
  LayerCode,
  Mode,
  SequenceSteps,
} from "@/contracts/animation";
import type { CharacterId, Wereform } from "@/contracts/build";
import type { MercenaryLook, MonsterLook } from "@/contracts/game-data";
import { isSkillId } from "@/data/rules/skills";

import { readAnimations } from "./animations";
import { cell, type GameCache, readTable, required, type Row, slugify } from "./game-files";
import { isAnimationWeaponClass, isMode } from "./skill-animations";

/** The `monstats.txt` row of each wereform and mercenary. */
const wereformRows: Readonly<Record<Exclude<Wereform, "none">, string>> = {
  werewolf: "wolf",
  werebear: "bear",
};

/** `hireling.txt` gives Frenzy and Taunt to `act5hire1`, Bash and Stun to `act5hire2`. */
const mercenaryRows: Partial<Readonly<Record<CharacterId, string>>> = {
  "rogue-scout": "roguehire",
  "desert-mercenary": "act2hire",
  "bash-barbarian": "act5hire2",
  "frenzy-barbarian": "act5hire1",
};

/** The `monstats2.txt` columns of each layer: the components it may draw, and whether it draws. */
const layerColumns: Readonly<Record<LayerCode, readonly [string, string]>> = {
  hd: ["HDv", "HD"],
  tr: ["TRv", "TR"],
  lg: ["LGv", "LG"],
  ra: ["Rav", "RA"],
  la: ["Lav", "LA"],
  rh: ["RHv", "RH"],
  lh: ["LHv", "LH"],
  sh: ["SHv", "SH"],
  s1: ["S1v", "S1"],
  s2: ["S2v", "S2"],
  s3: ["S3v", "S3"],
  s4: ["S4v", "S4"],
  s5: ["S5v", "S5"],
  s6: ["S6v", "S6"],
  s7: ["S7v", "S7"],
  s8: ["S8v", "S8"],
};

const skillSlots = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const hirelingSlots = [1, 2, 3, 4, 5, 6] as const;

interface Tables {
  readonly monstats: ReadonlyMap<string, Row>;
  readonly monstats2: ReadonlyMap<string, Row>;
  readonly hireling: readonly Row[];
  /** `monmode.txt` codes by row index, lowercase; its `xx` sequence row is `sq`. */
  readonly monmodes: readonly string[];
  readonly monseq: readonly Row[];
}

const excel = "files/data/data/global/excel";

async function readTables(cache: GameCache): Promise<Tables> {
  const table = (name: string, columns: readonly string[]): Promise<readonly Row[]> =>
    readTable(join(cache.dir, excel, name), columns);

  const [monstats, monstats2, hireling, monmodes, monseq] = await Promise.all([
    table("monstats.txt", ["Id", "*hcIdx", "Code", "MonStatsEx"]),
    table("monstats2.txt", ["Id", "BaseW", ...Object.values(layerColumns).flat()]),
    table("hireling.txt", ["Class"]),
    table("monmode.txt", ["name", "code"]),
    table("monseq.txt", ["sequence", "mode", "frame", "event"]),
  ]);

  return {
    monstats: new Map(monstats.map((row) => [cell(row, "Id"), row])),
    monstats2: new Map(monstats2.map((row) => [cell(row, "Id"), row])),
    hireling,
    monmodes: monmodes.map((row) =>
      cell(row, "name") === "sequence" ? "sq" : cell(row, "code").toLowerCase(),
    ),
    monseq,
  };
}

function lookOf(tables: Tables, id: string): MonsterLook {
  const monster = required(tables.monstats.get(id), `monstats.txt: no ${id}`);
  const drawn = required(
    tables.monstats2.get(cell(monster, "MonStatsEx")),
    `monstats2.txt: no ${cell(monster, "MonStatsEx")}`,
  );

  const weaponClass = cell(drawn, "BaseW");

  if (!isAnimationWeaponClass(weaponClass)) {
    throw new Error(`monstats2.txt: ${id} holds "${weaponClass}", not a weapon class`);
  }

  const components = Object.entries(layerColumns).flatMap(
    ([code, [variants, flag]]: readonly [string, readonly [string, string]]) => {
      const [first = ""] = cell(drawn, variants).replaceAll('"', "").split(",");

      return cell(drawn, flag) === "1" && first !== "" ? [[code, first] as const] : [];
    },
  );

  return {
    token: cell(monster, "Code").toLowerCase(),
    weaponClass,
    components: Object.fromEntries(components),
  };
}

function modeOf(tables: Tables, index: string): Mode {
  const code = required(tables.monmodes[Number(index)], `monmode.txt: no row ${index}`);

  if (!isMode(code)) {
    throw new Error(`monmode.txt: row ${index} is "${code}", not a mode`);
  }

  return code;
}

/** The `hireling.txt` skills of a mercenary the calculator knows, with their modes. */
function hirelingModes(tables: Tables, monster: Row): Readonly<Record<string, Mode>> {
  const rows = tables.hireling.filter((row) => cell(row, "Class") === cell(monster, "*hcIdx"));
  const modes = rows.flatMap((row) =>
    hirelingSlots.flatMap((slot) => {
      const skill = slugify(row.get(`Skill${slot}`) ?? "");

      return isSkillId(skill) ? [[skill, modeOf(tables, cell(row, `Mode${slot}`))] as const] : [];
    }),
  );

  return Object.fromEntries(modes);
}

/** The `monseq.txt` steps that `monstats.txt` names in the mode column of a sequence skill. */
function sequenceOf(
  tables: Tables,
  monster: Row,
  skillModes: Readonly<Record<string, Mode>>,
): SequenceSteps | null {
  const sequenceSkills = Object.keys(skillModes).filter((skill) => skillModes[skill] === "sq");

  if (sequenceSkills.length > 1) {
    throw new Error(`${cell(monster, "Id")} plays several sequences: ${sequenceSkills.join(", ")}`);
  }

  const [skill] = sequenceSkills;
  const slot = skillSlots.find(
    (candidate) => slugify(monster.get(`Skill${candidate}`) ?? "") === skill,
  );

  if (skill === undefined || slot === undefined) {
    return null;
  }

  const name = cell(monster, `Sk${slot}mode`);
  const rows = tables.monseq.filter((row) => cell(row, "sequence") === name);

  return {
    steps: rows.map((row) => {
      const mode = cell(row, "mode").toLowerCase();

      if (!isMode(mode)) {
        throw new Error(`monseq.txt: ${name} plays "${mode}", not a mode`);
      }

      return { mode, frame: Number(cell(row, "frame")) };
    }),
    hits: rows.flatMap((row, step) => (cell(row, "event") === "1" ? [step] : [])),
  };
}

export interface Monsters {
  readonly wereforms: Readonly<Record<Exclude<Wereform, "none">, MonsterLook>>;
  readonly mercenaries: Partial<Readonly<Record<CharacterId, MercenaryLook>>>;
  readonly animations: Readonly<
    Record<string, Partial<Readonly<Record<AnimationName, AnimationFrames>>>>
  >;
}

export async function extractMonsters(cache: GameCache): Promise<Monsters> {
  const tables = await readTables(cache);
  const wereforms = {
    werewolf: lookOf(tables, wereformRows.werewolf),
    werebear: lookOf(tables, wereformRows.werebear),
  };

  const mercenaries = Object.fromEntries(
    Object.entries(mercenaryRows).map(([character, id]: readonly [string, string]) => {
      const monster = required(tables.monstats.get(id), `monstats.txt: no ${id}`);
      const skillModes = hirelingModes(tables, monster);

      return [
        character,
        { ...lookOf(tables, id), skillModes, sequence: sequenceOf(tables, monster, skillModes) },
      ];
    }),
  );

  const tokens = new Set(
    [...Object.values(wereforms), ...Object.values(mercenaries)].map(({ token }) => token),
  );

  const records = await readAnimations(cache);

  return {
    wereforms,
    mercenaries,
    animations: Object.fromEntries(
      [...tokens].map((token) => [
        token,
        Object.fromEntries(
          [...records].flatMap(([name, frames]: readonly [string, AnimationFrames]) => {
            const rest = name.toLowerCase().slice(token.length);
            const mode = rest.slice(0, 2);
            const weaponClass = rest.slice(2);

            return name.toLowerCase().startsWith(token) &&
              isMode(mode) &&
              isAnimationWeaponClass(weaponClass)
              ? [[rest, frames]]
              : [];
          }),
        ),
      ]),
    ),
  };
}
