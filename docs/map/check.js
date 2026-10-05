// Validates the map's data without a browser: bun docs/map/check.js
// It loads the data files the way the page does (one shared global, in order)
// and fails on dangling ids, duplicate ids, bricks outside their zone and
// bricks that overlap. Arrow crossings and text overflow need a look at the
// rendered page.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const dir = __dirname;
const files = ["data-zones.js", "data-nodes.js", "data-edges.js"];
// In a browser, window is the global object: window.MAP is the global MAP.
const context = {};
context.window = context;
vm.createContext(context);
for (const file of files) {
  vm.runInContext(fs.readFileSync(path.join(dir, file), "utf8"), context, { filename: file });
}
const { MAP } = context;

const errors = [];
const nodeIds = new Set();
for (const node of MAP.nodes) {
  if (nodeIds.has(node.id)) errors.push(`duplicate brick id: ${node.id}`);
  nodeIds.add(node.id);
}
const zoneIds = new Set(MAP.zones.map((zone) => zone.id));
const isRef = (ref) => (ref.startsWith("z:") ? zoneIds.has(ref.slice(2)) : nodeIds.has(ref));

for (const edge of MAP.edges) {
  for (const end of [edge.from, edge.to]) {
    if (!isRef(end)) errors.push(`arrow ${edge.from} → ${edge.to}: unknown end ${end}`);
  }
}
for (const link of MAP.links ?? []) {
  for (const end of [link.from, link.to]) {
    if (!nodeIds.has(end)) errors.push(`link ${link.from} → ${link.to}: unknown brick ${end}`);
  }
}
for (const node of MAP.nodes) {
  if (node.zone && !zoneIds.has(node.zone)) errors.push(`brick ${node.id}: unknown zone ${node.zone}`);
  for (const id of node.couples ?? []) {
    if (!nodeIds.has(id)) errors.push(`brick ${node.id}: couples unknown brick ${id}`);
  }
}
for (const item of [MAP.overview, ...MAP.zones.map((zone) => zone.info), ...MAP.nodes.map((node) => node.info)]) {
  for (const id of item.see ?? []) {
    if (!nodeIds.has(id) && !zoneIds.has(id)) errors.push(`${item.title}: see unknown id ${id}`);
  }
}
for (const [id] of [...MAP.overview.seams, ...MAP.overview.traps]) {
  if (!nodeIds.has(id)) errors.push(`overview: unknown brick ${id}`);
}
for (const id of MAP.zoneOrder) {
  if (!zoneIds.has(id)) errors.push(`zoneOrder: unknown zone ${id}`);
}
for (const zone of MAP.zones) {
  if (!MAP.zoneOrder.includes(zone.id)) errors.push(`zoneOrder: missing zone ${zone.id}`);
}

// Zone-local boxes: below the 30-unit title strip, 4 units clear of the frame.
for (const node of MAP.nodes) {
  if (!node.zone) continue;
  const zone = MAP.zones.find((z) => z.id === node.zone);
  if (node.x < 4 || node.y < 30 || node.x + node.w > zone.w - 4 || node.y + node.h > zone.h - 4) {
    errors.push(`brick ${node.id}: outside zone ${zone.id} (${zone.w} x ${zone.h})`);
  }
}
for (const a of MAP.nodes) {
  for (const b of MAP.nodes) {
    if (a.id >= b.id || a.zone !== b.zone) continue;
    if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) {
      errors.push(`bricks ${a.id} and ${b.id} overlap`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`map ok: ${MAP.zones.length} zones, ${MAP.nodes.length} bricks, ${MAP.edges.length} arrows, ${(MAP.links ?? []).length} links`);
