import {
  type Baseline,
  type CaseOutput,
  type FieldChoice,
  type FieldSpec,
  type FormState,
  type OriginalInput,
  type OriginalTable,
  type OriginalValue,
  type PathRequest,
  type PathResponse,
  SELECT_ORDER,
  type SelectChoice,
  type SelectId,
} from "./original-form";

const DIVIDER_TEXT = "───────────";

const FRESH_MARKER = "iasGoldenCase";

function element(id: string): HTMLElement {
  const found = document.querySelector(`#${CSS.escape(id)}`);

  if (!(found instanceof HTMLElement)) {
    throw new TypeError(`#${id} is missing`);
  }

  return found;
}

function selectElement(id: string): HTMLSelectElement {
  const found = element(id);

  if (!(found instanceof HTMLSelectElement)) {
    throw new TypeError(`#${id} is not a select`);
  }

  return found;
}

function inputElement(id: string): HTMLInputElement {
  const found = element(id);

  if (!(found instanceof HTMLInputElement)) {
    throw new TypeError(`#${id} is not an input`);
  }

  return found;
}

/** Same test as the original `isElementHidden` (calculator.js:1568-1570), negated. */
function isShown(id: string): boolean {
  const found = element(id);

  return found.offsetWidth > 0 || found.offsetHeight > 0 || found.getClientRects().length > 0;
}

function offeredOptions(id: SelectId): string[] {
  const values: string[] = [];

  for (const option of selectElement(id).options) {
    if (option.style.display !== "none") {
      if (option.disabled && option.text !== DIVIDER_TEXT) {
        throw new Error(`#${id} has a disabled option that is not a divider: ${option.text}`);
      }

      values.push(option.disabled ? "divider" : option.value);
    }
  }

  return values;
}

function controlIds(selector: string): string[] {
  const ids: string[] = [];

  for (const control of document.querySelectorAll(selector)) {
    ids.push(control.id);
  }

  return ids;
}

function readControl(id: string): OriginalValue {
  const control = element(id);

  if (control instanceof HTMLSelectElement) {
    return control.value;
  }

  if (control instanceof HTMLInputElement && control.type === "checkbox") {
    return control.checked;
  }

  if (!(control instanceof HTMLInputElement) || control.type !== "number") {
    throw new TypeError(`#${id} is not a select, checkbox or number field`);
  }

  const value = Number(control.value);

  if (control.value.trim() === "" || !Number.isInteger(value)) {
    throw new Error(`#${id} holds a non-integer value: ${control.value}`);
  }

  return value;
}

function readInput(): Record<string, OriginalValue> {
  return Object.fromEntries(
    controlIds("#calculator select, #calculator input").map((id) => [id, readControl(id)]),
  );
}

function readFieldSpec(id: string): FieldSpec {
  const control = inputElement(id);

  if (control.type === "checkbox") {
    return { id, kind: "checkbox", initial: control.checked };
  }

  const max = control.getAttribute("max");

  return {
    id,
    kind: "number",
    min: Number(control.getAttribute("min")),
    max: max === null ? null : Number(max),
    initial: Number(control.value),
  };
}

function readBaseline(): Baseline {
  return {
    input: readInput(),
    fields: controlIds("#calculator input").map((id) => readFieldSpec(id)),
  };
}

function markFresh(baseline: OriginalInput): void {
  const root = document.documentElement;

  if (root.dataset[FRESH_MARKER] !== undefined) {
    throw new Error("the page is not fresh: a case already ran in this document");
  }

  root.dataset[FRESH_MARKER] = "ran";

  if (JSON.stringify(readInput()) !== JSON.stringify(baseline)) {
    throw new Error("the fresh page does not start from the baseline form values");
  }
}

function choose(id: SelectId, value: string): void {
  if (!isShown(id)) {
    throw new Error(`#${id} is hidden, cannot choose ${value}`);
  }

  if (!offeredOptions(id).includes(value)) {
    throw new Error(`#${id} does not offer ${value}`);
  }

  const select = selectElement(id);

  select.value = value;
  select.dispatchEvent(new Event("change"));
}

/** Sets the requested selects in canonical order; returns the first visible select left unset. */
function chooseSelects(selects: readonly SelectChoice[]): SelectId | null {
  const pending = new Map(selects);

  for (const id of SELECT_ORDER) {
    const value = pending.get(id);

    if (value !== undefined) {
      choose(id, value);
      pending.delete(id);
    } else if (isShown(id)) {
      if (pending.size > 0) {
        throw new Error(`#${id} is visible and unset, before ${[...pending.keys()].join(", ")}`);
      }

      return id;
    }
  }

  return null;
}

function fill([id, value]: FieldChoice): void {
  const control = inputElement(id);

  if (!isShown(id)) {
    throw new Error(`#${id} is hidden, cannot fill it`);
  }

  if (control.type === "checkbox" && (value === true || value === false)) {
    control.checked = value;
  } else if (control.type === "number" && value !== true && value !== false) {
    control.value = String(value);
  } else {
    throw new TypeError(`#${id} is a ${control.type} field, got ${value}`);
  }

  control.dispatchEvent(new Event("change"));
}

function readForm(): FormState {
  return {
    options: {
      characterSelect: offeredOptions("characterSelect"),
      wereformSelect: offeredOptions("wereformSelect"),
      skillSelect: offeredOptions("skillSelect"),
      primaryWeaponSelect: offeredOptions("primaryWeaponSelect"),
      secondaryWeaponSelect: offeredOptions("secondaryWeaponSelect"),
      tableVariableSelect: offeredOptions("tableVariableSelect"),
    },
    visible: controlIds("#calculator > div").filter((id) => isShown(id)),
  };
}

// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- DOM elements are mutable host objects
function readTable(container: Element): OriginalTable {
  if (container.querySelector("h4") !== null) {
    throw new Error("a table carries a name");
  }

  const rows: (readonly [string, string])[] = [];

  for (const row of container.querySelectorAll("tr")) {
    const [variable, frames, ...rest] = row.children;

    if (variable === undefined || frames === undefined || rest.length > 0) {
      throw new Error(`a table row has ${row.children.length} cells`);
    }

    rows.push([variable.textContent, frames.textContent]);
  }

  const [header, ...body] = rows;

  if (header === undefined) {
    throw new Error("a table has no header row");
  }

  return { header, rows: body };
}

/**
 * Note paragraphs come first, then tables (calculator.js:683-735). The app shows no notes, so the
 * paragraphs are skipped; any other layout would lose information.
 */
function readOutput(): CaseOutput {
  const tables: OriginalTable[] = [];

  for (const child of element("tableContainer").children) {
    const isNote = child.tagName === "P" && child.className === "tablesDesc" && tables.length === 0;

    if (child.tagName === "DIV" && child.className === "tableHeader") {
      tables.push(readTable(child));
    } else if (!isNote) {
      throw new Error(
        `unexpected <${child.tagName} class="${child.className}"> in #tableContainer`,
      );
    }
  }

  return { tables };
}

function runPath(request: PathRequest): PathResponse {
  markFresh(request.baseline);

  const branch = chooseSelects(request.selects);

  if (branch !== null) {
    return { kind: "branch", select: branch, options: offeredOptions(branch) };
  }

  for (const field of request.fields) {
    fill(field);
  }

  const input = readInput();

  for (const [id, value] of [...request.selects, ...request.fields]) {
    if (input[id] !== value) {
      throw new Error(`#${id} ends at ${input[id]}, requested ${value}`);
    }
  }

  return {
    kind: "leaf",
    input,
    form: readForm(),
    output: readOutput(),
    visibleFields: controlIds("#calculator input").filter((id) => isShown(id)),
  };
}

window.iasGolden = { readBaseline, runPath };
