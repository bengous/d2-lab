import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

import type { CharacterId } from "@/contracts/build";
import { gameData } from "@/data/generated/game-data";

import {
  cell,
  gameCache,
  monsterSpriteCache,
  readStrings,
  readTable,
  run,
  slugify,
  spriteCache,
  type GameCache,
} from "./game-files";
import { extractSprites } from "./sprites/extract-sprites";
import { offeredAnimations } from "./sprites/offered-animations";

interface Portrait {
  readonly character: CharacterId;
  /** PNG written by `tools/d2r-data` into `png/hireables/`, without its extension. */
  readonly file: string;
}

interface SkillCopy {
  readonly slug: string;
  readonly file: string;
}

interface SkillIcon {
  /** enUS name from `skills.json`. */
  readonly name: string;
  readonly classSkill: boolean;
  /** Cell PNG written by `tools/d2r-data` into `png/skillicons/`. */
  readonly file: string;
}

const outputDir = join(import.meta.dir, "..", "public/game");

/** Quality 85: an eighth of the PNG's weight, and no visible difference at three times the size. */
function toWebp(source: string, target: string): Promise<void> {
  return run(["magick", source, "-quality", "85", "-define", "webp:method=6", target]);
}

/** Portraits from `hd/global/ui/hireables/`. */
const portraits: readonly Portrait[] = [
  { character: "amazon", file: "amazonicon" },
  { character: "assassin", file: "assassinicon" },
  { character: "barbarian", file: "barbarianicon" },
  { character: "druid", file: "druidicon" },
  { character: "necromancer", file: "necromancericon" },
  { character: "paladin", file: "paladinicon" },
  { character: "sorceress", file: "sorceressicon" },
  { character: "warlock", file: "warlockicon" },
  { character: "rogue-scout", file: "rogueicon" },
  { character: "desert-mercenary", file: "act2hireableicon" },
  { character: "bash-barbarian", file: "barbhirable_icon" },
  { character: "frenzy-barbarian", file: "barbhirable_icon" },
];

/** The skill list of Warren's calculator, `constants.js:317-363@bcc112d`. */
const originalSkills: readonly string[] = [
  "Standard",
  "Throw",
  "Kick",
  "Dodge",
  "Impale",
  "Jab",
  "Strafe",
  "Fend",
  "Tiger Strike",
  "Cobra Strike",
  "Phoenix Strike",
  "Fists of Fire",
  "Claws of Thunder",
  "Blades of Ice",
  "Dragon Claw",
  "Dragon Tail",
  "Dragon Talon",
  "Laying Traps",
  "Double Swing",
  "Frenzy",
  "Taunt",
  "Double Throw",
  "Whirlwind",
  "Concentrate",
  "Berserk",
  "Bash",
  "Stun",
  "Feral Rage",
  "Hunger",
  "Rabies",
  "Fury",
  "Zeal",
  "Smite",
  "Sacrifice",
  "Vengeance",
  "Conversion",
  "Cleave",
  "Mirrored Blades",
];

/** Original names whose enUS skill name differs: "Standard" is the game's normal attack. */
const gameSkillNames: ReadonlyMap<string, string> = new Map([["Standard", "Attack"]]);

/** Original skills without an icon; the front shows their name instead. */
const skillsWithoutIcon: ReadonlyMap<string, string> = new Map([
  ["Kick", "its IconCel is an empty frame of spells/submenu/skillicon.sprite"],
  ["Laying Traps", "a trap-laying animation Warren's calculator lists, not a skill of the game"],
]);

/** Icon sheet per `charclass` of `skills.txt`; skills without a class use the submenu sheet. */
const iconSheets: ReadonlyMap<string, string> = new Map([
  ["", "skillicon"],
  ["ama", "amskillicon"],
  ["ass", "asskillicon"],
  ["bar", "baskillicon"],
  ["dru", "drskillicon"],
  ["nec", "neskillicon"],
  ["pal", "paskillicon"],
  ["sor", "soskillicon"],
  ["war", "waskillicon"],
]);

async function readSkillIcons(cache: GameCache): Promise<readonly SkillIcon[]> {
  const gameDir = join(cache.dir, "files/data/data");
  const skills = await readTable(join(gameDir, "global/excel/skills.txt"), [
    "charclass",
    "skilldesc",
  ]);

  const descriptions = await readTable(join(gameDir, "global/excel/skilldesc.txt"), [
    "skilldesc",
    "IconCel",
    "str name",
  ]);

  const names = await readStrings(join(gameDir, "local/lng/strings/skills.json"));
  const descriptionsById = new Map(descriptions.map((row) => [cell(row, "skilldesc"), row]));

  return skills.flatMap((skill) => {
    const charclass = cell(skill, "charclass");
    const description = descriptionsById.get(cell(skill, "skilldesc"));
    const name = description === undefined ? undefined : names.get(cell(description, "str name"));
    const sheet = iconSheets.get(charclass);

    return description === undefined || name === undefined || sheet === undefined
      ? []
      : [
          {
            name,
            classSkill: charclass !== "",
            file: `${sheet}_${cell(description, "IconCel").padStart(2, "0")}.png`,
          },
        ];
  });
}

/**
 * A name shared by a class skill and monster copies (`Whirlwind`, `Talic's Whirlwind`) keeps the
 * class skill; any other clash throws.
 */
function iconFile(icons: readonly SkillIcon[], name: string): string {
  const matches = icons.filter((icon) => icon.name === name);
  const classMatches = matches.filter((icon) => icon.classSkill);
  const files = new Set(
    (classMatches.length > 0 ? classMatches : matches).map((icon) => icon.file),
  );

  const [file] = files;

  if (file === undefined || files.size > 1) {
    throw new Error(`skills.txt: ${files.size} icons for the skill named ${name}`);
  }

  return file;
}

async function writePortraits(cache: GameCache): Promise<void> {
  await mkdir(join(outputDir, "portraits"));

  await Promise.all(
    portraits.map(({ character, file }) =>
      toWebp(
        join(cache.dir, "png/hireables", `${file}.png`),
        join(outputDir, "portraits", `${character}.webp`),
      ),
    ),
  );
}

async function writeSkillIcons(cache: GameCache): Promise<readonly string[]> {
  const icons = await readSkillIcons(cache);
  const copies = originalSkills.flatMap((originalName): readonly SkillCopy[] =>
    skillsWithoutIcon.has(originalName)
      ? []
      : [
          {
            slug: slugify(originalName),
            file: iconFile(icons, gameSkillNames.get(originalName) ?? originalName),
          },
        ],
  );

  await mkdir(join(outputDir, "skills"));

  await Promise.all(
    copies.map(({ slug, file }) =>
      toWebp(join(cache.dir, "png/skillicons", file), join(outputDir, "skills", `${slug}.webp`)),
    ),
  );

  return copies.map(({ slug }) => slug);
}

/** One icon per weapon family, from `png/weapons/`: the three tiers of a family share it. */
async function writeWeaponIcons(cache: GameCache): Promise<number> {
  const icons = new Set(gameData.weapons.flatMap(({ item }) => (item === null ? [] : [item.icon])));

  await mkdir(join(outputDir, "weapons"));

  await Promise.all(
    [...icons].map((icon) =>
      toWebp(
        join(cache.dir, "png/weapons", `${icon}.png`),
        join(outputDir, "weapons", `${icon}.webp`),
      ),
    ),
  );

  return icons.size;
}

const cache = await gameCache();

await rm(outputDir, { recursive: true, force: true });

await mkdir(outputDir, { recursive: true });

await writePortraits(cache);

const skillSlugs = await writeSkillIcons(cache);

const weaponIcons = await writeWeaponIcons(cache);

const animations = offeredAnimations();

const monsterTokens = new Set(
  animations.flatMap(({ folder, token }) => (folder === "monsters" ? [token] : [])),
);

const sheets = await extractSprites(
  { chars: await spriteCache(), monsters: await monsterSpriteCache([...monsterTokens]) },
  join(outputDir, "sprites"),
  animations,
);

console.log(
  `${outputDir}: ${portraits.length} portraits, ${skillSlugs.length} skill icons, ${weaponIcons} weapon icons, ${sheets} sprite sheets in ${animations.length} animations`,
);

for (const [name, reason] of skillsWithoutIcon) {
  console.log(`no icon for ${slugify(name)}: ${reason}`);
}
