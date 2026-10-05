import { defineConfig } from "oxfmt";
import { oxfmt } from "oxslop/oxfmt";

export default defineConfig({
  ...oxfmt({
    sortTailwindcss: true,
    ignorePatterns: ["docs/**", "tools/d2r-data/**", "apps/ias/public/game/**"],
  }),
});
