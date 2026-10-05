import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { cp, rm } from "node:fs/promises";

import tailwind from "bun-plugin-tailwind";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import { Calculator } from "@/ui/screens/calculator";

import publicFiles from "./public-files-plugin";

const outdir = `${import.meta.dir}/dist`;

const publicDir = `${import.meta.dir}/public`;

await rm(outdir, { recursive: true, force: true });

const output = await Bun.build({
  entrypoints: [`${import.meta.dir}/index.html`],
  outdir,
  plugins: [tailwind, publicFiles],
  minify: true,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
});

for (const artifact of output.outputs) {
  console.log(artifact.path);
}

/** The default build, painted before the JS loads; `src/main.tsx` hydrates it. */
const prerendered = renderToString(createElement(Calculator, { search: "" }));

/** Hides the prerendered default build on a share link, before the first paint. */
const shareLinkScript = `if(location.search)document.documentElement.classList.add("share-link-pending")`;

/** Base UI renders a few style attributes: the policy allows each one by its hash. */
const styleAttributes = new Set<string>();

for (const { groups } of prerendered.matchAll(/ style="(?<style>[^"]*)"/gu)) {
  styleAttributes.add(groups?.["style"] ?? "");
}

function sha256Source(text: string): string {
  return `'sha256-${createHash("sha256").update(text).digest("base64")}'`;
}

/** GitHub Pages sends no security header, so the page carries its own policy. */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' ${sha256Source(shareLinkScript)}`,
  `style-src-attr 'unsafe-hashes' ${[...styleAttributes].map((style) => sha256Source(style)).join(" ")}`,
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

const indexPath = `${outdir}/index.html`;

await Bun.write(
  indexPath,
  new HTMLRewriter()
    .on("meta[charset]", {
      // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- HTMLRewriter passes a mutable Element
      element(charset) {
        charset.after(
          `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}" /><script>${shareLinkScript}</script>`,
          { html: true },
        );
      },
    })
    .on("#root", {
      // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- HTMLRewriter passes a mutable Element
      element(root) {
        root.setInnerContent(prerendered, { html: true });
      },
    })
    .transform(await Bun.file(indexPath).text()),
);

if (existsSync(publicDir)) {
  await cp(publicDir, outdir, { recursive: true });
}
