import type { ShareLinkError } from "@/contracts/share-link";

/** The line the screen shows for an invalid link. */
export function shareLinkErrorText(error: ShareLinkError): string {
  if (error.kind === "unsupported-version") {
    return error.version === ""
      ? "This link has no version"
      : `Unsupported link version "${error.version}"`;
  }

  if (error.kind === "unknown-value") {
    return `Unknown value "${error.value}" for "${error.param}"`;
  }

  return `"${error.param}" is out of range: ${String(error.value)}`;
}
