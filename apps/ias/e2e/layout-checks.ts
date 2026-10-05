/**
 * The layout checks of `layout.e2e.ts`, run in the page by `locator.evaluate`: the function holds
 * every helper it calls, since Playwright sends its source alone.
 *
 * @module
 */
/* oxlint-disable unicorn/consistent-function-scoping -- Playwright sends `findLayoutProblems` to the page alone, so its helpers live inside it */

/**
 * Lists what looks broken on the page: a sideways scroll, an element out of its panel, text out of
 * its box, text closer than `touchPx` to a border or a line, and text over text. The character
 * strip scrolls on purpose. With `outline`, each element at fault gets a red outline.
 */
// oxlint-disable-next-line max-lines-per-function, max-statements, complexity -- one self-contained function: Playwright sends its source to the page without the module around it
export function findLayoutProblems(options: {
  readonly outline: boolean;
  readonly touchPx: number;
}): string[] {
  interface Box {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  }

  interface TextBox {
    readonly element: HTMLElement;
    readonly box: Box;
  }

  const problems = new Set<string>();
  const strip = document.querySelector('[role="radiogroup"][aria-label="Character"]');
  const everyElement = [...document.querySelectorAll<HTMLElement>("body *")];

  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- a DOM element, whose members are mutable
  function report(element: HTMLElement, problem: string): void {
    const text = (element.innerText || element.textContent || "").replaceAll(/\s+/gu, " ").trim();

    problems.add(`${problem}: <${element.tagName.toLowerCase()}> "${text.slice(0, 40)}"`);

    if (options.outline) {
      element.style.outline = "3px solid red";
    }
  }

  function pixels(length: string): number {
    return Number(length.replace(/px$/u, ""));
  }

  const pen = document.createElement("canvas").getContext("2d");

  if (pen === null) {
    throw new Error("no 2D canvas to measure text with");
  }

  /**
   * The box of a text's glyphs: a range's box spans the font's whole ascent and descent. `font`
   * lists its parts: the computed `font` shorthand is empty when, say, `font-variant-numeric` is set.
   */
  function inkOf(box: Box, text: string, font: string): Box {
    if (pen === null) {
      throw new Error("no 2D canvas to measure text with");
    }

    pen.font = font;

    const metrics = pen.measureText(text.trim());

    return {
      left: box.left,
      right: box.right,
      top: box.top + metrics.fontBoundingBoxAscent - metrics.actualBoundingBoxAscent,
      bottom: box.bottom - metrics.fontBoundingBoxDescent + metrics.actualBoundingBoxDescent,
    };
  }

  /**
   * The painted top border: a fieldset draws it through the middle of its rendered legend, with a
   * gap where the legend sits.
   */
  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- a DOM element, whose members are mutable
  function topBorder(element: HTMLElement, box: Box, width: number): TextBox[] {
    const legend = element.firstElementChild;
    const rendered =
      element.tagName === "FIELDSET" &&
      legend?.tagName === "LEGEND" &&
      getComputedStyle(legend).float === "none";

    if (!rendered) {
      return [{ element, box: { ...box, bottom: box.top + width } }];
    }

    const hole = legend.getBoundingClientRect();
    const middle = hole.top + hole.height / 2 - width / 2;
    const line = { top: middle, bottom: middle + width };

    return [
      { element, box: { ...line, left: box.left, right: hole.left } },
      { element, box: { ...line, left: hole.right, right: box.right } },
    ];
  }

  function isTransparent(color: string): boolean {
    return color === "transparent" || /,\s*0\)$/u.test(color);
  }

  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- a DOM element, whose members are mutable
  function isShown(element: Element): boolean {
    for (let node: Element | null = element; node !== null; node = node.parentElement) {
      const style = getComputedStyle(node);

      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        return false;
      }
    }

    const { width, height } = element.getBoundingClientRect();

    return width > 1 && height > 1;
  }

  /** The part of the window that the element's clipping ancestors leave visible. */
  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- a DOM node, whose members are mutable
  function visibleArea(node: Node): Box {
    let area: Box = { left: 0, top: -Infinity, right: innerWidth, bottom: Infinity };

    for (let parent = node.parentElement; parent !== null; parent = parent.parentElement) {
      const style = getComputedStyle(parent);

      if (style.overflowX !== "visible" || style.overflowY !== "visible") {
        const box = parent.getBoundingClientRect();

        area = {
          left: Math.max(area.left, box.left),
          top: Math.max(area.top, box.top),
          right: Math.min(area.right, box.right),
          bottom: Math.min(area.bottom, box.bottom),
        };
      }
    }

    return area;
  }

  /**
   * The layer an element paints in: its closest fixed or sticky ancestor, or absolute one with a
   * z-index, such as a popup or the navbar. Elements of two layers never collide.
   */
  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- a DOM element, whose members are mutable
  function layerOf(element: Element): Element | null {
    for (let node: Element | null = element; node !== null; node = node.parentElement) {
      const { position, zIndex } = getComputedStyle(node);

      const floats = position === "fixed" || position === "sticky";

      if (floats || (position === "absolute" && zIndex !== "auto")) {
        return node;
      }
    }

    return null;
  }

  /** The closest ancestor that scrolls sideways: its content moves under its edges on purpose. */
  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- a DOM element, whose members are mutable
  function scrollerOf(element: Element): Element | null {
    for (let node = element.parentElement; node !== null; node = node.parentElement) {
      const { overflowX } = getComputedStyle(node);

      if ((overflowX === "auto" || overflowX === "scroll") && node.scrollWidth > node.clientWidth) {
        return node;
      }
    }

    return null;
  }

  /** Two elements can collide: same layer, and no scroller that holds one and not the other. */
  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- DOM elements, whose members are mutable
  function canCollide(a: Element, b: Element): boolean {
    const scroller = scrollerOf(a);

    return layerOf(a) === layerOf(b) && (scroller === null || scroller.contains(b));
  }

  function intersect(a: Box, b: Box): Box {
    return {
      left: Math.max(a.left, b.left),
      top: Math.max(a.top, b.top),
      right: Math.min(a.right, b.right),
      bottom: Math.min(a.bottom, b.bottom),
    };
  }

  /** Negative when the boxes overlap. */
  function gap(a: Box, b: Box): number {
    return Math.max(a.left - b.right, b.left - a.right, a.top - b.bottom, b.top - a.bottom);
  }

  function isInside(box: Box, area: Box): boolean {
    return (
      box.left >= area.left - 0.5 &&
      box.right <= area.right + 0.5 &&
      box.top >= area.top - 0.5 &&
      box.bottom <= area.bottom + 0.5
    );
  }

  const root = document.documentElement;

  if (root.scrollWidth > root.clientWidth) {
    problems.add(`the page scrolls sideways by ${String(root.scrollWidth - root.clientWidth)} px`);
  }

  const shown: HTMLElement[] = [];

  for (const element of everyElement) {
    if (isShown(element)) {
      shown.push(element);
    }
  }

  for (const element of shown) {
    const { overflowX } = getComputedStyle(element);
    const excess = element.scrollWidth - element.clientWidth;

    if (
      (overflowX === "auto" || overflowX === "scroll") &&
      excess > 0 &&
      (strip === null || !element.contains(strip))
    ) {
      report(element, `scrolls sideways by ${String(excess)} px`);
    }
  }

  for (const panel of document.querySelectorAll("section")) {
    const edge = panel.getBoundingClientRect();

    for (const element of shown) {
      const box = intersect(element.getBoundingClientRect(), visibleArea(element));
      const out = Math.max(
        edge.left - box.left,
        box.right - edge.right,
        edge.top - box.top,
        box.bottom - edge.bottom,
      );

      if (panel.contains(element) && box.right > box.left && out > 0.5) {
        report(element, `leaves its panel by ${out.toFixed(1)} px`);
      }
    }
  }

  const texts: TextBox[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const element = node.parentElement;

    if (
      element !== null &&
      (node.textContent ?? "").trim() !== "" &&
      isShown(element) &&
      !isTransparent(getComputedStyle(element).color)
    ) {
      const area = visibleArea(node);
      const range = document.createRange();

      range.selectNodeContents(node);

      const { fontStyle, fontWeight, fontSize, fontFamily } = getComputedStyle(element);
      const font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;

      for (const box of range.getClientRects()) {
        if (box.width > 0 && isInside(box, area)) {
          texts.push({ element, box: inkOf(box, node.textContent ?? "", font) });
        }
      }

      if (element.scrollWidth > element.clientWidth + 1 && element.clientWidth > 0) {
        report(
          element,
          `text overflows its box by ${String(element.scrollWidth - element.clientWidth)} px`,
        );
      }
    }
  }

  const lines: TextBox[] = [];

  for (const element of shown) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const box: Box = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    const top = pixels(style.borderTopWidth);
    const right = pixels(style.borderRightWidth);
    const bottom = pixels(style.borderBottomWidth);
    const left = pixels(style.borderLeftWidth);

    if (top > 0 && !isTransparent(style.borderTopColor)) {
      lines.push(...topBorder(element, box, top));
    }

    if (bottom > 0 && !isTransparent(style.borderBottomColor)) {
      lines.push({ element, box: { ...box, top: box.bottom - bottom } });
    }

    if (left > 0 && !isTransparent(style.borderLeftColor)) {
      lines.push({ element, box: { ...box, right: box.left + left } });
    }

    if (right > 0 && !isTransparent(style.borderRightColor)) {
      lines.push({ element, box: { ...box, left: box.right - right } });
    }

    const isRule =
      (rect.width <= 2 || rect.height <= 2) &&
      element.childElementCount === 0 &&
      (element.textContent ?? "").trim() === "";

    if (isRule && !isTransparent(style.backgroundColor)) {
      lines.push({ element, box });
    }
  }

  const visibleLines: TextBox[] = [];

  for (const line of lines) {
    const box = intersect(line.box, visibleArea(line.element));

    if (box.right > box.left && box.bottom > box.top) {
      visibleLines.push({ element: line.element, box });
    }
  }

  for (const text of texts) {
    for (const line of visibleLines) {
      const distance = gap(text.box, line.box);

      if (distance < options.touchPx && canCollide(text.element, line.element)) {
        const owner = (line.element.textContent ?? "").replaceAll(/\s+/gu, " ").trim().slice(0, 30);

        report(
          text.element,
          `text ${distance < 0 ? "crosses" : "touches"} a line of <${line.element.tagName.toLowerCase()}> "${owner}"`,
        );
      }
    }
  }

  for (const [index, text] of texts.entries()) {
    for (const other of texts.slice(index + 1)) {
      const overlaps = gap(text.box, other.box) < -1;

      if (text.element !== other.element && overlaps && canCollide(text.element, other.element)) {
        report(
          text.element,
          `text overlaps "${(other.element.textContent ?? "").trim().slice(0, 30)}"`,
        );
      }
    }
  }

  return [...problems];
}
