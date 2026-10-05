import type { BunPlugin } from "bun";

/**
 * Leaves `/fonts/*` URLs to the files of `public/`: Bun would inline a small font of a CSS file as base64.
 * The built CSS sits next to `fonts/`, so a relative URL keeps the site servable under any path prefix.
 */
const publicFiles: BunPlugin = {
  name: "public-files",
  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Bun passes its mutable PluginBuilder
  setup(build) {
    build.onResolve(
      { filter: /^\/fonts\//u },
      // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Bun passes its mutable OnResolveArgs
      ({ path }) => ({ path: `.${path}`, external: true }),
    );
  },
};

export default publicFiles;
