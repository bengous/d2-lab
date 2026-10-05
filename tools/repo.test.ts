import { expect, test } from "bun:test";

type VersionMap = Readonly<Record<string, string>>;

const repoRoot = `${import.meta.dir}/..`;

const manifestPaths = [
  "package.json",
  ...new Bun.Glob("apps/*/package.json").scanSync({ cwd: repoRoot }),
];

const dependencyFields = ["dependencies", "devDependencies", "optionalDependencies"];

const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;

function isJsonObject(value: unknown): value is object {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isVersionMap(value: unknown): value is VersionMap {
  return isJsonObject(value) && Object.values(value).every((version) => isString(version));
}

async function loosePins(manifestPath: string): Promise<string[]> {
  const manifest: unknown = await Bun.file(`${repoRoot}/${manifestPath}`).json();

  if (!isJsonObject(manifest)) {
    throw new Error(`${manifestPath}: expected a JSON object`);
  }

  const fields = new Map(Object.entries(manifest));
  const loose: string[] = [];

  for (const field of dependencyFields) {
    const pins: unknown = fields.get(field);

    if (pins === undefined) {
      continue;
    }

    if (!isVersionMap(pins)) {
      throw new Error(`${manifestPath}: ${field} must map package names to versions`);
    }

    for (const [name, version] of Object.entries(pins)) {
      if (!exactVersion.test(version)) {
        loose.push(`${manifestPath} ${field} ${name}@${version}`);
      }
    }
  }

  return loose;
}

test.each(manifestPaths)("%s pins every dependency to an exact version", async (manifestPath) => {
  expect(await loosePins(manifestPath)).toEqual([]);
});
