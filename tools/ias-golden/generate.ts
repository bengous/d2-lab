import { availableParallelism } from "node:os";

import { chromium } from "playwright";

import { boundsOf, caseId, compareRanks, drawField, type PlannedCase, selectValue } from "./cases";
import type {
  FieldChoice,
  FieldSpec,
  OriginalInput,
  PathResponse,
  SelectChoice,
  SelectId,
} from "./original-form";
import { openPagePool, type PagePool } from "./page-pool";
import { UPSTREAM_SHA, withOriginalSite } from "./upstream";
import { type GoldenCase, writeGoldens } from "./write-goldens";

/** The reference Zeal and Smite Paladins, replayed with their own weapon instead of its class representative. */
const REFERENCE_BUILDS: readonly (readonly SelectChoice[])[] = [
  [
    ["characterSelect", "5"],
    ["wereformSelect", "0"],
    ["skillSelect", "Zeal"],
    ["primaryWeaponSelect", "Phase Blade"],
    ["tableVariableSelect", "1"],
  ],
  [
    ["characterSelect", "5"],
    ["wereformSelect", "0"],
    ["skillSelect", "Smite"],
    ["primaryWeaponSelect", "Phase Blade"],
    ["tableVariableSelect", "1"],
  ],
];

interface RunContext {
  readonly pool: PagePool;
  readonly baseline: OriginalInput;
  readonly weaponClasses: ReadonlyMap<string, string>;
}

interface TreeNode {
  readonly rank: readonly number[];
  readonly selects: readonly SelectChoice[];
  readonly choiceIndexes: Readonly<Partial<Record<SelectId, number>>>;
}

interface StructuralCase extends GoldenCase {
  /** The first weapon of each slot: the configuration the bounds cases start from. */
  readonly isBaseConfiguration: boolean;
}

type LeafResponse = Extract<PathResponse, { kind: "leaf" }>;

async function runLeaf(context: RunContext, planned: PlannedCase): Promise<LeafResponse> {
  const label = caseId(planned.selects, planned.fields);
  const response = await context.pool.runPath(label, {
    selects: planned.selects,
    fields: planned.fields,
    baseline: context.baseline,
  });

  if (response.kind !== "leaf") {
    throw new Error(`${label} stops at #${response.select}`);
  }

  return response;
}

/** Drops dividers and repeated skills, and keeps the first weapon of each (type, WSM) class. */
function branchValues(
  context: RunContext,
  select: SelectId,
  options: readonly string[],
): readonly string[] {
  const isWeapon = select === "primaryWeaponSelect" || select === "secondaryWeaponSelect";
  const keys = new Set<string>();

  return options.filter((value) => {
    if (value === "divider") {
      return false;
    }

    const key = isWeapon ? context.weaponClasses.get(value) : value;

    if (key === undefined) {
      throw new Error(`#${select} offers ${value}, which is not in weaponsMap`);
    }

    if (keys.has(key)) {
      return false;
    }

    keys.add(key);

    return true;
  });
}

async function explore(context: RunContext, node: TreeNode): Promise<StructuralCase[]> {
  const response = await context.pool.runPath(caseId(node.selects, []), {
    selects: node.selects,
    fields: [],
    baseline: context.baseline,
  });

  if (response.kind === "leaf") {
    const { primaryWeaponSelect = 0, secondaryWeaponSelect = 0 } = node.choiceIndexes;

    return [
      {
        planned: { kind: "structural", rank: node.rank, selects: node.selects, fields: [] },
        response,
        isBaseConfiguration: primaryWeaponSelect === 0 && secondaryWeaponSelect === 0,
      },
    ];
  }

  const children = await Promise.all(
    branchValues(context, response.select, response.options).map((value, index) =>
      explore(context, {
        rank: [...node.rank, index],
        selects: [...node.selects, [response.select, value]],
        choiceIndexes: { ...node.choiceIndexes, [response.select]: index },
      }),
    ),
  );

  return children.flat();
}

function variantOf(leaf: StructuralCase, fillOrder: readonly FieldSpec[]): PlannedCase | null {
  const { selects, rank } = leaf.planned;
  const visible = new Set(leaf.response.visibleFields);
  const seed = caseId(selects, []);
  const fields: FieldChoice[] = [];

  for (const spec of fillOrder) {
    const value = drawField(spec, seed);

    if (visible.has(spec.id) && value !== spec.initial) {
      fields.push([spec.id, value]);
    }
  }

  return fields.length === 0 ? null : { kind: "variant", rank: [...rank, 1], selects, fields };
}

function boundsCasesOf(leaf: StructuralCase, fillOrder: readonly FieldSpec[]): PlannedCase[] {
  const { selects, rank } = leaf.planned;
  const visible = new Set(leaf.response.visibleFields);

  return fillOrder.flatMap((spec, fieldIndex) =>
    boundsOf(spec).flatMap((value, boundIndex): PlannedCase[] =>
      visible.has(spec.id) && value !== spec.initial
        ? [
            {
              kind: "bounds",
              rank: [...rank, 2, fieldIndex, boundIndex],
              selects,
              fields: [[spec.id, value]],
            },
          ]
        : [],
    ),
  );
}

/**
 * One seeded variant per structural case, the bounds of each field on base configurations, and the
 * reference builds. A case whose id is already planned keeps the smaller rank.
 */
function planFilledCases(
  leaves: readonly StructuralCase[],
  fillOrder: readonly FieldSpec[],
): PlannedCase[] {
  const planned = new Map(
    leaves.map((leaf) => [caseId(leaf.planned.selects, []), leaf.planned] as const),
  );

  const references = REFERENCE_BUILDS.map((selects, index): PlannedCase => ({
    kind: "reference",
    rank: [Number.MAX_SAFE_INTEGER, index],
    selects,
    fields: [],
  }));

  const candidates = leaves.flatMap((leaf) => {
    const variant = variantOf(leaf, fillOrder);
    const bounds = leaf.isBaseConfiguration ? boundsCasesOf(leaf, fillOrder) : [];

    return variant === null ? bounds : [variant, ...bounds];
  });

  for (const candidate of [...candidates, ...references]) {
    const id = caseId(candidate.selects, candidate.fields);
    const known = planned.get(id);

    if (known === undefined || compareRanks(candidate.rank, known.rank) < 0) {
      planned.set(id, candidate);
    }
  }

  return [...planned.values()].filter((candidate) => candidate.kind !== "structural");
}

function logExploration(leaves: readonly StructuralCase[]): void {
  const skillLists = new Map<string, number>();
  const groups = new Set<string>();

  for (const { response } of leaves) {
    const { input, form } = response;
    const character = selectValue(input, "characterSelect");
    const wereform = selectValue(input, "wereformSelect");

    const skills = form.options.skillSelect.filter((skill) => skill !== "divider");

    skillLists.set(`${character}|${wereform}`, skills.length);
    groups.add(`${character}|${wereform}|${selectValue(input, "skillSelect")}`);
  }

  const listed = [...skillLists.values()].reduce((sum, count) => sum + count, 0);

  console.log(
    `${leaves.length} structural configurations; ${listed} (character, wereform, skill) options listed, ${groups.size} distinct`,
  );
}

const startedAt = performance.now();

const goldenCases = await withOriginalSite(async (site) => {
  const browser = await chromium.launch();

  try {
    const size = Math.max(1, availableParallelism() - 2);
    const pool = await openPagePool(browser, site.indexUrl, size);
    const [baseline, constants] = await Promise.all([pool.readBaseline(), pool.readConstants()]);
    const context: RunContext = {
      pool,
      baseline: baseline.input,
      weaponClasses: new Map(
        constants.weapons.map((weapon) => [weapon.name, `${weapon.type}/${weapon.wsm}`]),
      ),
    };

    const fillOrder = [
      ...baseline.fields.filter((spec) => spec.kind === "number"),
      ...baseline.fields.filter((spec) => spec.kind === "checkbox"),
    ];

    const structural = await explore(context, { rank: [], selects: [], choiceIndexes: {} });

    logExploration(structural);

    const filled = await Promise.all(
      planFilledCases(structural, fillOrder).map(async (planned) => ({
        planned,
        response: await runLeaf(context, planned),
      })),
    );

    pool.checkErrors();
    await pool.close();

    return [...structural, ...filled];
  } finally {
    await browser.close();
  }
});

await writeGoldens(goldenCases, {
  upstreamSha: UPSTREAM_SHA,
  seconds: (performance.now() - startedAt) / 1000,
});
