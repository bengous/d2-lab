import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot, hydrateRoot } from "react-dom/client";

import { Calculator } from "@/ui/screens/calculator";

const container = document.querySelector("#root");

if (container === null) {
  throw new Error("index.html has no #root element");
}

const app = (
  <StrictMode>
    <Calculator search={location.search} />
  </StrictMode>
);

/**
 * The built page holds the default build, prerendered by `build.ts`. A share link opens another
 * build: the page hides the prerendered one (`share-link-pending`) until React renders the link's.
 */
if (location.search === "" && container.firstElementChild !== null) {
  hydrateRoot(container, app);
} else {
  flushSync(() => {
    createRoot(container).render(app);
  });

  document.documentElement.classList.remove("share-link-pending");
}
