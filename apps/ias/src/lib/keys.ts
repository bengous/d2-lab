/**
 * The keys of a record, in declaration order, typed as its key type. A `Record` over a union
 * lists every member, so a list built from it grows with the union.
 */
export function keysOf<Key extends string, Value>(
  record: Readonly<Record<Key, Value>>,
): readonly Key[] {
  return Object.keys(record).filter((key): key is Key => Object.hasOwn(record, key));
}
