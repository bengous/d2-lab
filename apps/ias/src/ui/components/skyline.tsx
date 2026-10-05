/**
 * Place it in a `relative` container: it sits at the container's bottom, behind its content, in a haze
 * that rises above it. Its `lighten` blend needs the page background in the same stacking context:
 * an `isolate` container hides it, and the image's black, darker than the page, shows as a band.
 */
export function Skyline() {
  return (
    <>
      <div
        aria-hidden="true"
        className="fog-glow pointer-events-none absolute inset-x-0 bottom-0 -z-20 h-[34rem]"
      />
      <img
        src="art/skyline.webp"
        alt=""
        loading="lazy"
        decoding="async"
        width={2172}
        height={400}
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-auto w-full mask-t-from-45% opacity-60 mix-blend-lighten select-none"
      />
    </>
  );
}
