import { Fragment } from "react";

/** Parts joined by `·`; a narrow box wraps between two parts, never inside one. */
export function DotList({ parts }: { readonly parts: readonly string[] }) {
  return parts.map((part, index) => (
    <Fragment key={part}>
      {index > 0 && " "}
      <span className="whitespace-nowrap">{index === 0 ? part : `· ${part}`}</span>
    </Fragment>
  ));
}
