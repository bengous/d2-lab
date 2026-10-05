import { defineConfig, type OxlintOverride } from "oxlint";
import { oxslop } from "oxslop/config";

/**
 * The layers of `apps/ias/src`, from the bottom: contracts and lib, data, engine, share-link, ui.
 * A layer imports only the layers below it; `forbidden` lists the others.
 */
function layer(name: string, forbidden: readonly string[]): OxlintOverride {
  return {
    files: [`apps/ias/src/${name}/**`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: forbidden.map((other) => `@/${other}/**`),
              message: `${name} may not import ${forbidden.join(", ")}: see the layers in AGENTS.md.`,
            },
          ],
        },
      ],
    },
  };
}

export default defineConfig({
  plugins: ["eslint", "typescript", "unicorn", "oxc", "react", "jsx-a11y"],
  /** As in oxfmt.config.ts: the browser pages of `docs/` are documentation, checked by their own scripts. */
  ignorePatterns: ["docs/**"],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  categories: {
    correctness: "error",
    suspicious: "error",
    perf: "error",
    pedantic: "error",
  },
  rules: {
    eqeqeq: "error",
    complexity: ["error", { max: 10 }],
    "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
    "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
    "react/react-in-jsx-scope": "off",
    "typescript/prefer-readonly-parameter-types": ["error", { treatMethodsAsReadonly: true }],
  },
  overrides: [
    /** The sprite decoder and writers thread bit readers and typed arrays, which have no read-only type. */
    {
      files: ["tools/d2-dcc/**", "apps/ias/scripts/sprites/**"],
      rules: {
        "typescript/prefer-readonly-parameter-types": "off",
      },
    },
    {
      files: ["apps/ias/src/ui/components/ui/**"],
      rules: {
        "typescript/prefer-readonly-parameter-types": "off",
      },
    },
    layer("contracts", ["lib", "data", "engine", "share-link", "ui"]),
    layer("lib", ["contracts", "data", "engine", "share-link", "ui"]),
    layer("data", ["engine", "share-link", "ui"]),
    layer("engine", ["share-link", "ui"]),
    layer("share-link", ["ui"]),
  ],
  extends: [oxslop({ effect: "auto", strict: true })],
});
