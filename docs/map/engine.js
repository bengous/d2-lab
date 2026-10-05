// Draws the map from window.MAP (filled by the data-*.js files) and runs it:
// zoom by viewBox, level of detail, selection, couplings, the side panel.
// It holds no content: a new brick, arrow or text belongs in a data file.
// Sections: drawing (once, at load), view box, state and panel, input, start.
(() => {
  const { W, H } = MAP;
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("map");
  const panel = document.getElementById("panel");
  const crumbs = document.getElementById("crumbs");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const zones = Object.fromEntries(MAP.zones.map((z) => [z.id, z]));
  const nodes = {};
  for (const n of MAP.nodes) {
    const z = n.zone && zones[n.zone];
    nodes[n.id] = Object.assign({}, n, z ? { x: n.x + z.x, y: n.y + z.y } : {});
  }
  // Order of the ← → zone tour in the panel, and of the overview chips.
  const ZONE_ORDER = MAP.zoneOrder;

  // ---------- drawing ----------
  // Layers, back to front: grid, repo frame, zones (frame, zoomed-out summary,
  // zoomed-in title), bricks, arrows with their labels, title block. Arrows go
  // above bricks so their labels stay readable; routes avoid crossing bricks.
  const defs = el("defs", {}, svg);
  const pat = el("pattern", { id: "grid", width: 100, height: 100, patternUnits: "userSpaceOnUse" }, defs);
  for (let i = 0; i < 100; i += 20) {
    el("line", { x1: i, y1: 0, x2: i, y2: 100, stroke: "var(--grid)", "stroke-width": i ? 0.6 : 1.2 }, pat);
    el("line", { x1: 0, y1: i, x2: 100, y2: i, stroke: "var(--grid)", "stroke-width": i ? 0.6 : 1.2 }, pat);
  }
  for (const [id, cls] of [
    ["arr", ""],
    ["arr-deny", "deny"],
    ["arr-hot", "hot"],
  ]) {
    const m = el(
      "marker",
      {
        id,
        viewBox: "0 0 10 10",
        refX: 8.5,
        refY: 5,
        markerWidth: 5.5,
        markerHeight: 5.5,
        orient: "auto-start-reverse",
        markerUnits: "strokeWidth",
      },
      defs,
    );
    el("path", { d: "M0,0 L10,5 L0,10 z", class: "arrowhead " + cls }, m);
  }
  el("rect", { x: -W * 2, y: -H * 2, width: W * 5, height: H * 5, fill: "url(#grid)" }, svg);

  const F = MAP.frame;
  el("rect", { x: F.x, y: F.y, width: F.w, height: F.h, rx: 8, class: "w-frame" }, svg);
  el("text", { x: F.x + 22, y: F.y + 46, class: "w-frame-title" }, svg).textContent = F.title;
  el("text", { x: F.x + F.subX, y: F.y + 44, class: "w-frame-sub" }, svg).textContent = F.sub;

  // Groups are dashed frames around the zones of one part (the app and its
  // layers); labels are free captions. Both read at every zoom level.
  for (const gr of MAP.groups || []) {
    el("rect", { x: gr.x, y: gr.y, width: gr.w, height: gr.h, rx: 10, class: "w-group" }, svg);
    el("text", { x: gr.x + 18, y: gr.y + 28, class: "w-group-title lod-far" }, svg).textContent = gr.title;
    el("text", { x: gr.x + gr.w - 18, y: gr.y + 27, class: "w-group-sub lod-far", "text-anchor": "end" }, svg).textContent = gr.sub;
  }
  for (const l of MAP.labels || []) el("text", { x: l.x, y: l.y, class: "w-label lod-far" }, svg).textContent = l.text;

  const zoneLayer = el("g", {}, svg);
  const nodeLayer = el("g", {}, svg);
  const edgeLayer = el("g", {}, svg);
  const farGroups = [],
    nearGroups = [];

  for (const z of MAP.zones) {
    const g = el(
      "g",
      { class: "zone" + (z.ext ? " ext" : ""), "data-zone": z.id, style: `--zc: var(${z.color})` },
      zoneLayer,
    );
    const bg = el(
      "rect",
      {
        x: z.x,
        y: z.y,
        width: z.w,
        height: z.h,
        rx: 6,
        class: "zone-bg hit-zone hit",
        tabindex: 0,
        role: "button",
        "aria-label": "Zone " + z.title,
      },
      g,
    );
    bg.addEventListener("click", (e) => {
      if (!consumeDrag()) focusZone(z.id);
      e.stopPropagation();
    });
    bg.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        focusZone(z.id);
      }
    });
    z.el = g;
    if (z.band) {
      el("text", { x: z.x + 16, y: z.y + 32, class: "z-title" }, g).textContent = z.title;
      el("text", { x: z.x + z.w - 16, y: z.y + 30, class: "z-tag", "text-anchor": "end" }, g).textContent = z.tag;
      continue;
    }
    const far = el("g", { class: "lod-far", "pointer-events": "none" }, g);
    el("text", { x: z.x + 18, y: z.y + 44, class: "z-title" }, far).textContent = z.title;
    el("text", { x: z.x + 18, y: z.y + 66, class: "z-tag" }, far).textContent = z.tag;
    // A flat zone (one row of bricks) writes its keywords on one line.
    if (z.h < 140) {
      el("text", { x: z.x + 18, y: z.y + 86, class: "z-kw" }, far).textContent = z.kw.join("  ·  ");
    } else {
      z.kw.forEach((k, i) => {
        const y = z.y + 96 + i * 26;
        el("rect", { x: z.x + 18, y: y - 9, width: 7, height: 7, class: "z-kw-mark" }, far);
        el("text", { x: z.x + 34, y, class: "z-kw" }, far).textContent = k;
      });
    }
    farGroups.push(far);
    const near = el("g", { class: "lod-near", "pointer-events": "none" }, g);
    el("text", { x: z.x + 10, y: z.y + 16, class: "z-near-title" }, near).textContent = z.title;
    el("text", { x: z.x + z.w - 10, y: z.y + 15, class: "z-near-tag", "text-anchor": "end" }, near).textContent = z.tag;
    nearGroups.push(near);
  }

  // Text metrics per node kind, in world units. They must match the font
  // sizes of .node .lbl / .sub in index.html, or labels drift off-center.
  const SIZES = {
    normal: { l: 8.6, s: 5.3, lh: 6.4, gap: 2.8 },
    big: { l: 21, s: 12, lh: 14.5, gap: 5 },
    step: { l: 24, s: 11.5, lh: 14, gap: 8 },
  };
  for (const n of Object.values(nodes)) {
    const kind = n.kind || "normal";
    const sz = SIZES[kind] || SIZES.normal;
    const lod = n.zone ? "lod-near" : "";
    const g = el(
      "g",
      {
        class: `node ${kind} ${lod} hit`,
        "data-node": n.id,
        style: `--zc: var(${n.color})`,
        tabindex: 0,
        role: "button",
        "aria-label": n.label.replace(/\n/g, " "),
      },
      nodeLayer,
    );
    el(
      "rect",
      { x: n.x, y: n.y, width: n.w, height: n.h, rx: kind === "normal" || kind === "off" ? 3 : 5, class: "box" },
      g,
    );
    const lines = n.sub ? n.sub.split("\n") : [];
    const total = sz.l + (lines.length ? sz.gap + lines.length * sz.lh - (sz.lh - sz.s) : 0);
    const top = n.y + n.h / 2 - total / 2;
    const cx = n.x + n.w / 2;
    el("text", { x: cx, y: top + sz.l * 0.78, class: "lbl", "text-anchor": "middle" }, g).textContent = n.label;
    lines.forEach((line, i) => {
      el(
        "text",
        { x: cx, y: top + sz.l + sz.gap + i * sz.lh + sz.s * 0.8, class: "sub", "text-anchor": "middle" },
        g,
      ).textContent = line;
    });
    g.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!consumeDrag()) selectNode(n.id);
    });
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectNode(n.id);
      }
    });
    n.el = g;
  }

  const boxOf = (ref) => {
    if (ref.startsWith("z:")) {
      const z = zones[ref.slice(2)];
      return { x: z.x, y: z.y, w: z.w, h: z.h };
    }
    return nodes[ref];
  };
  const clip = (b, toward) => {
    const cx = b.x + b.w / 2,
      cy = b.y + b.h / 2;
    const dx = toward[0] - cx,
      dy = toward[1] - cy;
    const t = Math.min(dx ? b.w / 2 / Math.abs(dx) : Infinity, dy ? b.h / 2 / Math.abs(dy) : Infinity);
    return [cx + dx * t, cy + dy * t];
  };
  const center = (b) => [b.x + b.w / 2, b.y + b.h / 2];

  // A flow between two bricks of the same zone (MAP.links) is also drawn,
  // when its straight line crosses no other brick of the zone. Any other flow
  // stays a highlight on selection.
  const links = (MAP.links || []).filter((l) => nodes[l.from] && nodes[l.to]);
  const crossesBrick = ([p, q], zone, ends) =>
    Object.values(nodes).some((n) => {
      if (n.zone !== zone || ends.includes(n.id)) return false;
      for (let i = 1; i < 32; i++) {
        const x = p[0] + ((q[0] - p[0]) * i) / 32,
          y = p[1] + ((q[1] - p[1]) * i) / 32;
        if (x > n.x - 2 && x < n.x + n.w + 2 && y > n.y - 2 && y < n.y + n.h + 2) return true;
      }
      return false;
    });
  const drawnLinks = new Map();
  for (const l of links) {
    const a = nodes[l.from],
      b = nodes[l.to];
    if (!a.zone || a.zone !== b.zone) continue;
    const pair = [l.from, l.to].sort().join("|");
    if (drawnLinks.has(pair)) {
      drawnLinks.get(pair).two = true;
      continue;
    }
    const pts = [clip(a, center(b)), clip(b, center(a))];
    if (crossesBrick(pts, a.zone, [a.id, b.id])) continue;
    const edge = { from: l.from, to: l.to, level: "near", kind: "link", pts };
    drawnLinks.set(pair, edge);
    MAP.edges.push(edge);
  }

  MAP.edges.forEach((e) => {
    let pts;
    if (e.pts) pts = e.pts;
    else {
      const a = boxOf(e.from),
        b = boxOf(e.to),
        via = e.via || [];
      const first = via.length ? via[0] : center(b);
      const last = via.length ? via[via.length - 1] : center(a);
      pts = [clip(a, first), ...via, clip(b, last)];
    }
    const lodCls = e.level === "far" ? "lod-far far" : e.level === "near" ? "lod-near" : "far";
    const g = el("g", { class: `edge ${lodCls} ${e.kind || ""}`, "pointer-events": "none" }, edgeLayer);
    const path = el("path", { d: "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L") }, g);
    const marker = e.kind === "deny" ? "url(#arr-deny)" : "url(#arr)";
    path.setAttribute("marker-end", marker);
    if (e.two) path.setAttribute("marker-start", marker);
    if (e.label) {
      let i = e.lp;
      if (i === undefined) {
        let best = -1;
        i = 0;
        for (let k = 0; k < pts.length - 1; k++) {
          const d = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]);
          if (d > best) {
            best = d;
            i = k;
          }
        }
      }
      const [x1, y1] = pts[i],
        [x2, y2] = pts[i + 1];
      const lt = e.lt === undefined ? 0.5 : e.lt;
      const lx = x1 + (x2 - x1) * lt,
        ly = y1 + (y2 - y1) * lt;
      const flat = Math.abs(x2 - x1) > Math.abs(y2 - y1);
      // A label on a flat segment sits above the line instead of hiding the arrow.
      const lift = e.level === "near" ? 2.2 : 6;
      const t = el(
        "text",
        flat
          ? { x: lx, y: ly - lift, class: "elabel", "text-anchor": "middle" }
          : { x: lx, y: ly, class: "elabel", "text-anchor": "middle", "dominant-baseline": "middle" },
        g,
      );
      t.textContent = e.label;
    }
    e.el = g;
    e.path = path;
    e.marker = marker;
  });

  // Title block, as on an engineering drawing
  const cart = el("g", { class: "cartouche", "pointer-events": "none" }, svg);
  const C = MAP.cartouche;
  el("rect", { x: C.x, y: C.y, width: C.w, height: C.h }, cart);
  el("text", { x: C.x + 14, y: C.y + 30, class: "t" }, cart).textContent = C.title;
  C.rows.forEach(([k, v], i) => {
    const y = C.y + 44 + i * 34;
    el("line", { x1: C.x, y1: y, x2: C.x + C.w, y2: y }, cart);
    el("text", { x: C.x + 12, y: y + 22, class: "k" }, cart).textContent = k;
    el("text", { x: C.x + 92, y: y + 22, class: "v" }, cart).textContent = v;
  });
  el("line", { x1: C.x + 82, y1: C.y + 44, x2: C.x + 82, y2: C.y + C.h }, cart);

  // ---------- view box ----------
  // The camera is the SVG viewBox, always at the aspect of the element, so
  // nothing is letterboxed. focusRect remembers the last zone or brick framed,
  // so a resize reframes it; free zoom and drag clear it.
  let vb = { x: 0, y: 0, w: W, h: H };
  let focusRect = null;
  let anim = 0;
  const aspect = () => {
    const r = svg.getBoundingClientRect();
    return r.width && r.height ? r.width / r.height : W / H;
  };
  const fit = (r, pad) => {
    const a = aspect();
    let x = r.x - pad,
      y = r.y - pad,
      w = r.w + 2 * pad,
      h = r.h + 2 * pad;
    if (w / h < a) {
      const nw = h * a;
      x -= (nw - w) / 2;
      w = nw;
    } else {
      const nh = w / a;
      y -= (nh - h) / 2;
      h = nh;
    }
    return { x, y, w, h };
  };
  const MIN_W = 120,
    MAX_W = W * 2.2;

  // s = 1 at the overview, 2 to 6 with a zone framed. Zone summaries fade
  // out and bricks fade in between s = 1.3 and 1.8; #map.near (near > 0.5)
  // switches which layer receives clicks.
  const setVB = (v) => {
    vb = v;
    svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
    const s = W / v.w;
    const far = clamp((1.8 - s) / 0.5, 0, 1),
      near = clamp((s - 1.3) / 0.5, 0, 1);
    svg.style.setProperty("--far", far);
    svg.style.setProperty("--near", near);
    svg.classList.toggle("near", near > 0.5);
  };
  // Width moves on a log scale, so zooming in and out feel the same speed.
  const animateTo = (t) => {
    cancelAnimationFrame(anim);
    if (reduced) {
      setVB(t);
      return;
    }
    const s0 = vb,
      t0 = performance.now(),
      dur = 650;
    const c0 = [s0.x + s0.w / 2, s0.y + s0.h / 2],
      c1 = [t.x + t.w / 2, t.y + t.h / 2];
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const w = Math.exp(Math.log(s0.w) + (Math.log(t.w) - Math.log(s0.w)) * e);
      const h = w * (t.h / t.w);
      const cx = c0[0] + (c1[0] - c0[0]) * e,
        cy = c0[1] + (c1[1] - c0[1]) * e;
      setVB({ x: cx - w / 2, y: cy - h / 2, w, h });
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };
  const goRect = (r, pad) => {
    focusRect = { r, pad };
    animateTo(fit(r, pad));
  };
  const zoomAt = (p, f, animate) => {
    const w = clamp(vb.w * f, MIN_W, MAX_W),
      k = w / vb.w;
    const t = { x: p[0] - (p[0] - vb.x) * k, y: p[1] - (p[1] - vb.y) * k, w, h: vb.h * k };
    focusRect = null;
    if (animate) animateTo(t);
    else {
      cancelAnimationFrame(anim);
      setVB(t);
    }
  };
  const toWorld = (cx, cy) => {
    const r = svg.getBoundingClientRect();
    return [vb.x + ((cx - r.left) / r.width) * vb.w, vb.y + ((cy - r.top) / r.height) * vb.h];
  };

  // ---------- state and panel ----------
  // state.zone and state.node are the whole UI state. render() rebuilds the
  // panel and the breadcrumb, then toggles classes on the map: focused zone,
  // selected brick, coupled bricks, hot arrows.
  const state = { zone: null, node: null };

  const chip = (id) => {
    const n = nodes[id],
      z = zones[id];
    const item = n || z;
    if (!item) return "";
    const color = item.color;
    const label = (n ? n.label : z.title).replace(/\n/g, " ");
    return `<button type="button" class="chip" data-go="${id}" style="--zc: var(${color})"><span class="dot"></span>${esc(label)}</button>`;
  };
  const pointList = (items) =>
    `<ul class="points">${items.map(([id, text]) => `<li>${text} ${chip(id)}</li>`).join("")}</ul>`;
  const renderInfo = (info, color, extra, coupled) => {
    let h = `<div style="--zc: var(${color || "--ink-3"})">`;
    if (info.kicker) h += `<p class="kicker">${esc(info.kicker)}</p>`;
    h += `<h2><span class="swatch"></span>${info.title}</h2>`;
    if (info.lead) h += `<p class="lead">${info.lead}</p>`;
    if (info.io)
      h += `<h3>Contract</h3><dl class="facts io">${info.io.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
    if (info.swap || (coupled && coupled.length)) {
      h += `<h3>To replace</h3>`;
      if (info.swap) h += `<p>${info.swap}</p>`;
      if (coupled && coupled.length)
        h += `<p class="label">Changes with it, outlined on the map:</p><div class="chips">${coupled.map(chip).join("")}</div>`;
    }
    if (info.extend) h += `<h3>To extend</h3><p>${info.extend}</p>`;
    if (info.seams) h += `<h3>Extension points</h3>${pointList(info.seams)}`;
    if (info.traps) h += `<h3>Couplings to know</h3>${pointList(info.traps)}`;
    if (info.why && info.why.length) h += `<h3>Why</h3><ul>${info.why.map((w) => `<li>${w}</li>`).join("")}</ul>`;
    if (info.alt) h += `<h3>Rejected or postponed</h3><p class="alt">${info.alt}</p>`;
    if (info.facts)
      h += `<h3>Facts</h3><dl class="facts">${info.facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
    if (info.warn) h += `<h3>Open point</h3><p class="warn">${info.warn}</p>`;
    if (info.how) h += `<h3>How to read</h3><p>${info.how}</p>`;
    if (extra) h += extra;
    if (info.see && info.see.length) h += `<h3>See also</h3><div class="chips">${info.see.map(chip).join("")}</div>`;
    if (info.src) h += `<p class="src">Source: ${esc(info.src)}</p>`;
    return h + "</div>";
  };
  // Selecting a brick outlines the bricks it reads from and feeds, and the
  // panel lists them.
  const flowList = (id) => {
    const into = links.filter((l) => l.to === id);
    const out = links.filter((l) => l.from === id);
    const item = (other, label) => `<li>${chip(other)} <span class="flow">${esc(label)}</span></li>`;
    let h = "";
    if (into.length) h += `<p class="label">Reads from</p><ul class="flows">${into.map((l) => item(l.from, l.label)).join("")}</ul>`;
    if (out.length) h += `<p class="label">Feeds</p><ul class="flows">${out.map((l) => item(l.to, l.label)).join("")}</ul>`;
    return h ? `<h3>Flows</h3>${h}` : "";
  };
  const linkedWith = (id) => links.flatMap((l) => (l.from === id ? [l.to] : l.to === id ? [l.from] : []));
  // Couplings are declared on either side; this makes them symmetric.
  const coupledWith = (id) => {
    const set = new Set(nodes[id].couples || []);
    for (const n of Object.values(nodes)) if ((n.couples || []).includes(id)) set.add(n.id);
    set.delete(id);
    return [...set].filter((c) => nodes[c]);
  };
  const render = () => {
    let html;
    const coupled = state.node ? coupledWith(state.node) : [];
    const linked = state.node ? linkedWith(state.node) : [];
    if (state.node) {
      const n = nodes[state.node];
      const up = n.zone || n.zoneOf;
      const nav = up
        ? `<div class="nav"><button type="button" data-go="${up}">↑ ${esc(zones[up].title)}</button></div>`
        : "";
      html = renderInfo(n.info, n.color, flowList(n.id), coupled) + nav;
    } else if (state.zone) {
      const z = zones[state.zone];
      const i = ZONE_ORDER.indexOf(z.id);
      const prev = zones[ZONE_ORDER[(i + ZONE_ORDER.length - 1) % ZONE_ORDER.length]];
      const next = zones[ZONE_ORDER[(i + 1) % ZONE_ORDER.length]];
      html =
        renderInfo(z.info, z.color, "") +
        `<div class="nav"><button type="button" data-go="${prev.id}">← ${esc(prev.title)}</button><button type="button" data-go="${next.id}">${esc(next.title)} →</button></div>`;
    } else {
      const extra = `<h3>Zones</h3><div class="chips">${ZONE_ORDER.map(chip).join("")}</div>`;
      html = renderInfo(MAP.overview, "--accent", extra);
    }
    panel.innerHTML = html;
    panel.scrollTop = 0;

    const parts = [
      `<button type="button" data-go="" ${!state.zone && !state.node ? 'aria-current="true"' : ""}>${esc(MAP.frame.title)}</button>`,
    ];
    const zid = state.node ? nodes[state.node].zone || nodes[state.node].zoneOf : state.zone;
    if (zid)
      parts.push(
        `<span class="sep">›</span><button type="button" data-go="${zid}" ${!state.node ? 'aria-current="true"' : ""}>${esc(zones[zid].title)}</button>`,
      );
    if (state.node)
      parts.push(
        `<span class="sep">›</span><button type="button" aria-current="true">${esc(nodes[state.node].label.replace(/\n/g, " "))}</button>`,
      );
    crumbs.innerHTML = parts.join("");

    for (const z of MAP.zones) z.el.classList.toggle("focused", z.id === zid);
    for (const n of Object.values(nodes)) {
      n.el.classList.toggle("selected", n.id === state.node);
      n.el.classList.toggle("coupled", coupled.includes(n.id));
      n.el.classList.toggle("linked", linked.includes(n.id) && !coupled.includes(n.id));
    }
    for (const e of MAP.edges) {
      const hot = !!state.node && (e.from === state.node || e.to === state.node);
      e.el.classList.toggle("hot", hot);
      const m = hot ? "url(#arr-hot)" : e.marker;
      e.path.setAttribute("marker-end", m);
      if (e.two) e.path.setAttribute("marker-start", m);
    }
    // Keeps #id in the URL so a link reopens the same view; a sandboxed frame
    // may refuse it.
    try {
      history.replaceState(null, "", state.node || state.zone ? "#" + (state.node || state.zone) : location.pathname);
    } catch (_) {
      /* sandboxed frame */
    }
  };
  const go = (id) => {
    if (!id) home();
    else if (zones[id]) focusZone(id);
    else if (nodes[id]) selectNode(id);
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (b && (panel.contains(b) || crumbs.contains(b))) go(b.dataset.go);
  });

  const zoneRect = (z) => ({ x: z.x, y: z.y, w: z.w, h: z.h });
  function focusZone(id) {
    state.zone = id;
    state.node = null;
    goRect(zoneRect(zones[id]), zones[id].band ? 12 : 16);
    render();
  }
  function selectNode(id) {
    const n = nodes[id];
    const zid = n.zone || n.zoneOf || null;
    const sameZone = state.zone === zid;
    state.node = id;
    state.zone = zid;
    const inView = n.x >= vb.x && n.y >= vb.y && n.x + n.w <= vb.x + vb.w && n.y + n.h <= vb.y + vb.h;
    if (n.zone) {
      if (!sameZone || !svg.classList.contains("near") || !inView) goRect(zoneRect(zones[n.zone]), 16);
    } else if (n.zoneOf) {
      if (!sameZone) goRect(zoneRect(zones[n.zoneOf]), 12);
    } else if (!inView) {
      goRect({ x: n.x, y: n.y, w: n.w, h: n.h }, 220);
    }
    render();
  }
  function home() {
    state.zone = null;
    state.node = null;
    goRect({ x: 0, y: 0, w: W, h: H }, 10);
    render();
  }

  // ---------- input ----------
  // Pointer events drive drag and pinch; a press that moved more than 5 px is a
  // drag, and consumeDrag() stops the click that follows it from selecting.
  document.getElementById("btn-home").addEventListener("click", home);
  document
    .getElementById("btn-in")
    .addEventListener("click", () => zoomAt([vb.x + vb.w / 2, vb.y + vb.h / 2], 0.6, true));
  document
    .getElementById("btn-out")
    .addEventListener("click", () => zoomAt([vb.x + vb.w / 2, vb.y + vb.h / 2], 1 / 0.6, true));
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (state.node) {
      const n = nodes[state.node];
      const up = n.zone || n.zoneOf;
      up ? focusZone(up) : home();
    } else if (state.zone) home();
  });

  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(toWorld(e.clientX, e.clientY), Math.exp(clamp(dy, -120, 120) * 0.0022), false);
    },
    { passive: false },
  );

  const pointers = new Map();
  let drag = null,
    dragged = false;
  function consumeDrag() {
    const d = dragged;
    dragged = false;
    return d;
  }
  svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    dragged = false;
    drag = { start: [e.clientX, e.clientY], vb: { ...vb }, moved: false, pinch: null };
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      drag.pinch = {
        d: Math.hypot(a[0] - b[0], a[1] - b[1]),
        mid: toWorld((a[0] + b[0]) / 2, (a[1] + b[1]) / 2),
        vb: { ...vb },
      };
    }
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag || !pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    const r = svg.getBoundingClientRect();
    if (drag.pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const p = drag.pinch;
      const w = clamp(p.vb.w * (p.d / d), MIN_W, MAX_W),
        k = w / p.vb.w;
      cancelAnimationFrame(anim);
      focusRect = null;
      drag.moved = true;
      setVB({ x: p.mid[0] - (p.mid[0] - p.vb.x) * k, y: p.mid[1] - (p.mid[1] - p.vb.y) * k, w, h: p.vb.h * k });
      return;
    }
    const dx = e.clientX - drag.start[0],
      dy = e.clientY - drag.start[1];
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    svg.classList.add("dragging");
    cancelAnimationFrame(anim);
    focusRect = null;
    setVB({
      x: drag.vb.x - (dx / r.width) * drag.vb.w,
      y: drag.vb.y - (dy / r.height) * drag.vb.h,
      w: drag.vb.w,
      h: drag.vb.h,
    });
  });
  const endPointer = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (drag && drag.moved) dragged = true;
    if (pointers.size === 0) {
      drag = null;
      svg.classList.remove("dragging");
    } else if (drag) {
      const [p] = [...pointers.values()];
      drag = { start: p, vb: { ...vb }, moved: true, pinch: null };
    }
  };
  window.addEventListener("pointerup", endPointer);
  window.addEventListener("pointercancel", endPointer);

  new ResizeObserver(() => {
    if (focusRect) {
      cancelAnimationFrame(anim);
      setVB(fit(focusRect.r, focusRect.pad));
    } else {
      const a = aspect(),
        cx = vb.x + vb.w / 2,
        cy = vb.y + vb.h / 2,
        h = vb.w / a;
      setVB({ x: vb.x, y: cy - h / 2, w: vb.w, h });
    }
  }).observe(svg);

  // ---------- start ----------
  focusRect = { r: { x: 0, y: 0, w: W, h: H }, pad: 10 };
  setVB(fit(focusRect.r, focusRect.pad));
  const start = (location.hash || "").slice(1);
  if (start && (zones[start] || nodes[start])) {
    state.zone = zones[start] ? start : nodes[start].zone || nodes[start].zoneOf || null;
    state.node = nodes[start] ? start : null;
    const z = state.zone && zones[state.zone];
    if (z) {
      focusRect = { r: zoneRect(z), pad: z.band ? 12 : 16 };
      setVB(fit(focusRect.r, focusRect.pad));
    }
  }
  render();
})();
