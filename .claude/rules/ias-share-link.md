---
paths:
  - "apps/ias/src/share-link/**"
---

# IAS share link

- The link format is version 1 (`?v=1&...`). Its parameter names are part of the format: a renamed parameter breaks the links already shared. The name of each speed and slow parameter sits in a `Record` of `params.ts`.
- `shareParams` sets the order in which a link is validated and written: the selects in the form's canonical order (class, form, skill, weapon, offhand, onehand, table), then `current`, the speed fields, the slows. `share-link.test.ts` pins it: a new parameter goes at its field's place in the `Record`, and the pinned list moves with it. Parsing ignores the order of a link, so older links still load.
- Errors: a parameter for a hidden field, or a slug the form does not offer, is `unknown-value`; a number outside its bounds, floors and ceilings included, is `out-of-range`. A new error kind is a contract change.
- `parse` ends with `normalize`; `serialize` writes `normalize(build)`. A round trip gives back `normalize(build)`: `goldens.share-link` checks it on every golden case.
