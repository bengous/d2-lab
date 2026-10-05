/** Columns of at least 18rem: the weapon and speed panels share them, so their fields line up. */
export const fieldGrid =
  "@container grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] items-center gap-x-4 gap-y-3";

/** Spans two columns of `fieldGrid` once two fit: 2 × 18rem and the 1rem gap. */
export const fieldGridWide = "@min-[37rem]:col-span-2";
