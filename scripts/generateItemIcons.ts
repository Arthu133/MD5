import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { items } from "../src/data/items";
import type { ItemCategory } from "../src/types/game";

const outputDirectory = path.resolve("public/assets/items");

const palettes: Record<ItemCategory, [string, string, string]> = {
  AD: ["#401a24", "#ff6f7e", "#ffd18a"],
  AP: ["#261b4d", "#9a7bff", "#7dd3fc"],
  Tank: ["#17313a", "#56d39d", "#d5f4e5"],
  Bruiser: ["#452318", "#f59e5b", "#fbd38d"],
  Assassin: ["#21132f", "#d066ff", "#ff6f7e"],
  Marksman: ["#342b18", "#e4b85f", "#8fbdff"],
  Enchanter: ["#17383b", "#7de2d1", "#f7b8ff"],
  Controller: ["#22234c", "#809cff", "#c4b5fd"],
  Engage: ["#3b2917", "#f2b85f", "#fff0b5"],
  Peel: ["#193442", "#65c7ef", "#d8f4ff"],
  Utility: ["#243044", "#7fa8d8", "#e2ebf7"],
  Scaling: ["#2f2148", "#b98bff", "#f2d27a"],
  EarlyGame: ["#431d1d", "#ff7b5f", "#ffd36b"],
  ObjectiveControl: ["#17332d", "#55d69c", "#f0d57a"],
  AntiBurst: ["#2a303c", "#8ca3bd", "#ff8a8a"],
  AntiTank: ["#3d2719", "#ffad66", "#e8e0cc"],
  Sustain: ["#17372b", "#62d999", "#d7ffde"],
  Mobility: ["#152f45", "#5ba5ff", "#b6e5ff"],
  WaveClear: ["#31214a", "#b178ff", "#ffb4ec"],
  SplitPush: ["#332818", "#d7aa5b", "#8edb8c"],
};

const glyphs: Record<ItemCategory, string> = {
  AD: '<path d="M18 47 43 17l4 4-25 30-8 2 4-6Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="m37 18 9-4 4 4-4 9" fill="currentColor"/>',
  AP: '<path d="M31 11 43 31 32 53 20 32Z" fill="currentColor"/><circle cx="32" cy="32" r="7" fill="#eef8ff"/>',
  Tank: '<path d="M32 11 49 18v13c0 11-7 18-17 23-10-5-17-12-17-23V18Z" fill="currentColor"/><path d="M32 17v29" stroke="#edfdf5" stroke-width="3"/>',
  Bruiser: '<path d="m17 18 12 8-7 23-8-5 5-15Z" fill="currentColor"/><path d="m47 18-12 8 7 23 8-5-5-15Z" fill="currentColor"/>',
  Assassin: '<path d="m18 49 9-28 5-8 3 9-10 29Z" fill="currentColor"/><path d="m38 16 10 7-9 5Z" fill="#ffe6ef"/>',
  Marksman: '<circle cx="32" cy="32" r="17" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="32" cy="32" r="7" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 8v12M32 44v12M8 32h12M44 32h12" stroke="currentColor" stroke-width="3"/>',
  Enchanter: '<path d="M32 13c8 8 13 14 13 23a13 13 0 1 1-26 0c0-9 5-15 13-23Z" fill="currentColor"/><path d="M25 36h14M32 29v14" stroke="#f4ffff" stroke-width="3"/>',
  Controller: '<path d="M17 18h30v7H17zM21 27h22l-5 10 5 10H21l5-10Z" fill="currentColor"/>',
  Engage: '<path d="M17 43V24l7-7 6 9 4-13 7 13 7-8v25l-8 8H25Z" fill="currentColor"/>',
  Peel: '<circle cx="32" cy="32" r="19" fill="none" stroke="currentColor" stroke-width="5"/><path d="m32 17 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z" fill="currentColor"/>',
  Utility: '<path d="M16 43 28 14h8l12 29-9-5-7 12-7-12Z" fill="currentColor"/><circle cx="32" cy="28" r="5" fill="#f2f7ff"/>',
  Scaling: '<path d="m14 43 6-23 12 8 12-8 6 23-18 8Z" fill="currentColor"/><circle cx="32" cy="35" r="6" fill="#fff0b5"/>',
  EarlyGame: '<path d="m34 9-18 27h14l-2 19 20-29H35Z" fill="currentColor"/>',
  ObjectiveControl: '<path d="M32 10 48 22v20L32 54 16 42V22Z" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="32" cy="32" r="8" fill="currentColor"/>',
  AntiBurst: '<path d="M17 17h30v20c0 10-7 15-15 19-8-4-15-9-15-19Z" fill="currentColor"/><path d="m24 30 8-9 8 9-8 15Z" fill="#fff1f1"/>',
  AntiTank: '<path d="M12 34h40M32 13l10 19-10 19-10-19Z" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="32" cy="32" r="5" fill="currentColor"/>',
  Sustain: '<path d="M32 53S15 43 15 28c0-13 15-15 17-4 2-11 17-9 17 4 0 15-17 25-17 25Z" fill="currentColor"/>',
  Mobility: '<path d="M12 39c14-2 20-11 24-27 6 9 8 18 5 27l11 5-23 8-5-9Z" fill="currentColor"/>',
  WaveClear: '<path d="M9 38c10-13 18-13 25 0 7 13 14 12 21-1-8 21-20 22-29 5-5-9-10-9-17-4Z" fill="currentColor"/><path d="M12 27c8-8 15-8 21 0" fill="none" stroke="currentColor" stroke-width="3"/>',
  SplitPush: '<path d="M14 47h36M19 47V29l13-14 13 14v18M27 47V34h10v13" fill="none" stroke="currentColor" stroke-width="4"/>',
};

const hashName = (value: string) =>
  [...value].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7);

const renderIcon = (name: string, category: ItemCategory) => {
  const hash = hashName(name);
  const [background, accent, glow] = palettes[category];
  const rotation = (hash % 19) - 9;
  const runeX = 12 + (hash % 40);
  const runeY = 12 + ((hash >> 4) % 40);

  return `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="35%" cy="25%">
      <stop offset="0" stop-color="${accent}" stop-opacity=".32"/>
      <stop offset="1" stop-color="${background}"/>
    </radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect x="1" y="1" width="62" height="62" rx="12" fill="url(#bg)" stroke="${accent}" stroke-opacity=".55"/>
  <circle cx="${runeX}" cy="${runeY}" r="2" fill="${glow}" opacity=".55"/>
  <path d="M9 51 20 55M44 9l11 4" stroke="${glow}" stroke-opacity=".28" stroke-width="2"/>
  <g color="${accent}" filter="url(#glow)" transform="rotate(${rotation} 32 32)">${glyphs[category]}</g>
  <rect x="5" y="5" width="54" height="54" rx="9" fill="none" stroke="${glow}" stroke-opacity=".14"/>
</svg>`;
};

await mkdir(outputDirectory, { recursive: true });

await Promise.all(
  items.map((item) =>
    writeFile(
      path.join(outputDirectory, `${item.id}.svg`),
      renderIcon(item.name, item.category),
      "utf8",
    ),
  ),
);

console.log(`Generated ${items.length} fictional item icons in ${outputDirectory}`);
