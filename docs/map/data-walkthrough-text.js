// The words of the Walkthrough tab. The values come from data-walkthrough.js,
// which `bun run map:walkthrough` generates from the engine: this file only
// says what each step does and where it lives. Paths are under apps/ias/src/
// unless they start with apps/, docs/ or tools/.
//
// Each step:
//   id      the section anchor, and the key walkthrough.js renders it with
//   fn      the function the step runs
//   at      file:line of that function
//   title   the step's heading
//   lead    what the step does, in two or three sentences (HTML: <code> only)
//   then    an optional line under the values
window.MAP_WALKTHROUGH_TEXT = {
  title: "One build, from the link to the swing",
  lead: "Follow one build through the calculator: a Zeal Paladin with a Thunder Maul at 83 IAS and Fanaticism 20. Every value on this tab comes from the engine. <code>bun run map:walkthrough</code> writes them, and <code>bun test</code> fails when they no longer match.",
  site: "https://bengous.github.io/d2-lab/",
  steps: [
    {
      id: "parse",
      fn: "parseShareLink",
      at: "share-link/parse.ts:62",
      title: "Read the link",
      lead: "The link starts from <code>defaultBuild</code>, the original form's first state, and applies each parameter in the order of <code>shareParams</code>. A parameter for a field the form hides is an error, so a link only holds a build the form can show. The build it returns is normalized.",
      then: "Every other field keeps its default value.",
    },
    {
      id: "form",
      fn: "resolveForm",
      at: "engine/available-inputs.ts:171",
      title: "Resolve the form",
      lead: "Each select depends on the ones before it: character, wereform, skill, primary weapon, off hand, then table variable. <code>resolveForm</code> coerces them in that order and returns the <code>InputSpec</code>: the options of each select, the fields shown, and the floors and ceilings the build imposes.",
    },
    {
      id: "normalize",
      fn: "normalize",
      at: "engine/normalize.ts:56",
      title: "Normalize what the player typed",
      lead: "The UI keeps the raw build, with every value the player typed. The engine reads only <code>normalize(raw)</code>: the selects coerced, the hidden fields reset to their defaults, and each value moved within its floor and ceiling. Here a player types Burst of Speed 10 and Frenzy 5.",
    },
    {
      id: "speed",
      fn: "eiasValues",
      at: "engine/speed.ts:110",
      title: "Add up the speed",
      lead: "The game turns every speed source into one number, EIAS. For one weapon, <code>EIAS = SIAS − WSM + iasToEias(GIAS + WIAS)</code>, and <code>iasToEias(x) = ⌊120x / (120 + x)⌋</code> (<code>engine/speed.ts:37</code>).",
      parts: {
        sias: "SIAS: speed from skills",
        wsm1: "WSM: the weapon's speed modifier",
        gias: "GIAS: IAS from gear. IAS is the table variable here, so each row varies it instead",
        wias1: "WIAS: IAS on the weapon",
        eias: "EIAS before the table variable",
      },
    },
    {
      id: "tables",
      fn: "computeTables",
      at: "engine/compute-tables.ts:137",
      title: "Compute the breakpoint table",
      lead: "The engine raises the acceleration one step at a time and keeps each step where the frames per attack change: a breakpoint. <code>variableValue</code> turns the EIAS of each breakpoint back into the table variable, here IAS. <code>locate</code> (<code>engine/locate.ts:9</code>) finds the row of the build's value.",
      then: "<code>(6)+10</code> reads: hits of 6 frames repeat, and the last hit takes 10 (<code>RollbackHits</code>, <code>contracts/result.ts:3</code>). The per-second value comes from <code>ui/screens/hit-labels.ts</code>.",
    },
    {
      id: "timeline",
      fn: "attackTimeline",
      at: "engine/animation.ts:294",
      title: "Play the attack",
      lead: "The timeline reuses the speed steps of the table, so the animation cannot disagree with the table. It names the clip to draw and gives one <code>Tick</code> per game frame. The page stacks the legacy sprites layer by layer, in the order of the manifest, at the game's frame rate.",
      then: "The sprites come from <code>apps/ias/public/game/sprites/</code>, which <code>bun run assets:extract</code> writes from the game files.",
    },
  ],
  footer: "The Map tab is written by hand and checked by <code>bun docs/map/check.js</code>. This tab is generated: change the engine, then run <code>bun run map:walkthrough</code>.",
};
