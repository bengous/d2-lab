// Renders the Walkthrough tab from window.MAP_WALKTHROUGH (generated values)
// and window.MAP_WALKTHROUGH_TEXT (words). It holds no content and no game
// logic: every number it shows is read from the generated file, and the
// animation draws the ticks the engine computed.
(() => {
  const W = window.MAP_WALKTHROUGH;
  const T = window.MAP_WALKTHROUGH_TEXT;
  const root = document.getElementById("walkthrough");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const code = (s) => `<code>${esc(s)}</code>`;
  const shown = (v) => (typeof v === "string" ? v : JSON.stringify(v));
  const facts = (rows) =>
    `<dl class="facts">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
  const chips = (items, cls) =>
    `<div class="chips">${items.map((i) => `<span class="tag ${cls || ""}">${esc(i)}</span>`).join("")}</div>`;

  // ---------- one renderer per step id ----------
  const render = {
    parse() {
      const params = [...new URLSearchParams(W.link)];
      const url = `<p class="url"><span class="host">${esc(T.site)}</span>${params
        .map(([k, v], i) => `<span class="q">${i ? "&amp;" : "?"}<b>${esc(k)}</b>=${esc(v)}</span>`)
        .join("")}</p>`;
      const rows = W.parse.changes
        .map(([f, a, b]) => `<tr><td>${code(f)}</td><td class="was">${esc(shown(a))}</td><td class="now">${esc(shown(b))}</td></tr>`)
        .join("");
      return `${url}<div class="scroll"><table><thead><tr><th>Field</th><th>${code(W.parse.from)}</th><th>Link</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },
    form() {
      const f = W.form;
      const ceil = f.ceilingSources
        .map((c) => `${code(c.field)} at most ${c.max}<span class="src">${esc(c.source)}</span>`)
        .join("<br>");
      return (
        facts([
          ["Wereforms", chips(f.wereforms)],
          [`Skills <span class="n">${f.skills.length}</span>`, chips(f.skills)],
          ["Primary weapons", `<span class="big">${f.primaryWeapons}</span> options`],
          ["Off hand", chips(f.secondaryWeapons)],
          ["Table variables", chips(f.tableVariables)],
          [`Fields shown <span class="n">${f.fields.length}</span>`, chips(f.fields, "on")],
          [`Fields hidden <span class="n">${f.hidden.length}</span>`, chips(f.hidden, "off")],
          ["Floors", Object.keys(f.floors).length ? esc(JSON.stringify(f.floors)) : "none for this build"],
          ["Ceilings", ceil || "none"],
        ]) +
        `<p class="then">${code("ias")} is hidden because IAS is the table variable: ${code("current")} holds it.</p>`
      );
    },
    normalize() {
      const byField = new Map(W.normalize.normalized.map(([f, a, b]) => [f, b]));
      const rows = W.normalize.typed
        .map(([f, , typed]) => {
          const key = f.replace(/^speed\.|^slows\./, "");
          const after = byField.has(f) ? byField.get(f) : typed;
          const why = W.form.hidden.includes(key)
            ? "hidden field: reset to its default"
            : key in W.form.ceilings
              ? `ceiling: lowered to ${W.form.ceilings[key]}`
              : "kept";
          return `<tr><td>${code(f)}</td><td class="was">${esc(shown(typed))}</td><td class="now">${esc(shown(after))}</td><td class="why">${why}</td></tr>`;
        })
        .join("");
      return `<div class="scroll"><table><thead><tr><th>Field</th><th>Typed</th><th>Normalized</th><th>Why</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },
    speed(step) {
      const s = W.speed;
      const term = (k, sign) =>
        `<div class="term"><span class="sign">${sign}</span><span class="v">${s[k]}</span><span class="k">${step.parts[k]}</span></div>`;
      const sum = `<div class="sum">${term("sias", "")}${term("wsm1", "−")}<div class="term"><span class="sign">+</span><span class="v">iasToEias(${s.gias} + ${s.wias1})</span><span class="k">${step.parts.gias}; ${step.parts.wias1}</span></div><div class="term total"><span class="sign">=</span><span class="v">${s.eias}</span><span class="k">${step.parts.eias}</span></div></div>`;
      return `${sum}<p class="then">At the build's ${s.iasToEias.ias} IAS: ${code(`iasToEias(${s.iasToEias.ias}) = ${s.iasToEias.eias}`)}.</p>`;
    },
    tables() {
      const now = W.locate && W.locate.now.value;
      const out = W.tables
        .map((t) => {
          const rows = t.rows
            .map(
              (r) =>
                `<tr class="${r.value === now ? "is-now" : ""}"><td>${r.value}</td><td>${esc(r.frames)}</td><td>${r.hits.join(" · ")}</td><td>${r.perSecond}</td><td>${r.value === now ? '<span class="pill">Now</span>' : ""}</td></tr>`,
            )
            .join("");
          return `<div class="scroll"><table class="bp"><caption>${code(t.role)} table, variable ${code(t.variable)}</caption><thead><tr><th>${esc(t.variable.toUpperCase())}</th><th>Frames</th><th>Frames per hit</th><th>Per second</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
        })
        .join("");
      const next = W.locate && W.locate.next;
      const status = next
        ? `<p class="then">Next breakpoint: ${next.value} ${W.tables[0].variable.toUpperCase()}, ${esc(next.frames)}.</p>`
        : `<p class="then">${now} is the last row: the fastest breakpoint of this table.</p>`;
      return out + status;
    },
    timeline() {
      const tl = W.timeline;
      const c = tl.clip;
      const cells = tl.ticks
        .map((t, i) => `<span class="cell${t.hit ? " hit" : ""}" data-i="${i}" data-seg="${segOf(i) % 2}">${t.hit ? t.hit : ""}</span>`)
        .join("");
      return `<div class="player">
  <canvas id="sprite" role="img" aria-label="The Paladin swings the Thunder Maul"></canvas>
  <div class="side">
    ${facts([
      ["Clip", `${code(c.token)} ${code(c.folder)} · weapon class ${code(c.weaponClass)} · right hand ${code(c.weapons.right)}`],
      ["Game frames", `<span class="big">${tl.ticks.length}</span> per attack, hits of ${tl.hits.join(", ")}`],
      ["Frame rate", `${tl.framesPerSecond.frames} per second<span class="src">${esc(tl.framesPerSecond.source)}</span>`],
    ])}
    <div class="controls-row">
      <button type="button" id="wt-play" aria-pressed="false">Play</button>
      <button type="button" id="wt-step">Next frame</button>
      <label class="slow"><input type="checkbox" id="wt-slow"> Quarter speed</label>
    </div>
    <p class="counter" id="wt-counter" aria-live="polite"></p>
  </div>
</div>
<div class="strip" aria-label="One cell per game frame; a number marks the frame where a hit lands">${cells}</div>`;
    },
  };

  const segStarts = W.timeline.hits.reduce((acc, n) => [...acc, acc[acc.length - 1] + n], [0]);
  function segOf(i) {
    let k = 0;
    while (k + 1 < segStarts.length && i >= segStarts[k + 1]) k++;
    return k;
  }

  // ---------- page ----------
  const sections = T.steps
    .map(
      (step, i) => `<section class="step" id="step-${step.id}" aria-labelledby="h-${step.id}">
  <div class="rail"><span class="num">${i + 1}</span><span class="line"></span></div>
  <div class="body">
    <p class="kicker">${code(step.fn)} · ${esc(step.at)}</p>
    <h2 id="h-${step.id}">${step.title}</h2>
    <p class="lead">${step.lead}</p>
    <div class="values">${render[step.id](step)}</div>
    ${step.then ? `<p class="then">${step.then}</p>` : ""}
  </div>
</section>`,
    )
    .join("");
  root.innerHTML = `<div class="wt">
  <header class="wt-head">
    <h2>${T.title}</h2>
    <p class="lead">${T.lead}</p>
    <p class="open"><a href="${esc(T.site + W.link)}" target="_blank" rel="noopener">Open this build on the site</a></p>
  </header>
  ${sections}
  <p class="foot">${T.footer}</p>
</div>`;

  // ---------- animation ----------
  // Draws the tick's sprite frame: each layer of manifest.order[frame], back
  // to front, cut from its sheet at frame * box.width.
  const canvas = document.getElementById("sprite");
  const ctx = canvas.getContext("2d");
  const SCALE = 2;
  const images = {};
  const ready = [];
  for (const [mode, anim] of Object.entries(W.sprites)) {
    images[mode] = {};
    for (const [layer, url] of Object.entries(anim.sheets)) {
      const img = new Image();
      ready.push(new Promise((ok) => (img.onload = ok)));
      img.src = url;
      images[mode][layer] = img;
    }
  }
  const firstBox = Object.values(W.sprites)[0].manifest.box;
  canvas.width = firstBox.width * SCALE;
  canvas.height = firstBox.height * SCALE;

  const cells = [...root.querySelectorAll(".strip .cell")];
  const counter = document.getElementById("wt-counter");
  const ticks = W.timeline.ticks;
  let at = 0;

  function draw(i) {
    const tick = ticks[i];
    const anim = W.sprites[tick.mode];
    const frame = Math.floor(tick.position);
    const box = anim.manifest.box;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const layer of anim.manifest.order[frame]) {
      const img = images[tick.mode][layer];
      if (img) ctx.drawImage(img, frame * box.width, 0, box.width, box.height, 0, 0, box.width * SCALE, box.height * SCALE);
    }
    cells.forEach((c, k) => c.classList.toggle("at", k === i));
    const seg = segOf(i);
    counter.textContent = `Game frame ${i + 1} of ${ticks.length} · hit ${seg + 1} of ${W.timeline.hits.length}${tick.hit ? " lands" : ""}`;
  }

  let timer = 0;
  const playBtn = document.getElementById("wt-play");
  const slow = document.getElementById("wt-slow");
  const period = () => (1000 / W.timeline.framesPerSecond.frames) * (slow.checked ? 4 : 1);
  function stop() {
    clearInterval(timer);
    timer = 0;
    playBtn.textContent = "Play";
    playBtn.setAttribute("aria-pressed", "false");
  }
  function play() {
    clearInterval(timer);
    timer = setInterval(() => {
      at = (at + 1) % ticks.length;
      draw(at);
    }, period());
    playBtn.textContent = "Pause";
    playBtn.setAttribute("aria-pressed", "true");
  }
  playBtn.addEventListener("click", () => (timer ? stop() : play()));
  slow.addEventListener("change", () => timer && play());
  document.getElementById("wt-step").addEventListener("click", () => {
    stop();
    at = (at + 1) % ticks.length;
    draw(at);
  });
  cells.forEach((c, k) =>
    c.addEventListener("click", () => {
      stop();
      at = k;
      draw(at);
    }),
  );

  // Plays only while the tab is open; the page calls these on tab change.
  window.MAP_WALKTHROUGH_VIEW = {
    shown() {
      Promise.all(ready).then(() => {
        draw(at);
        if (!reduced && !timer) play();
      });
    },
    hidden: stop,
  };
})();
