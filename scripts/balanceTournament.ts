import { championProfiles } from "../src/data/champions/championProfiles";
import { competitiveCompTemplates } from "../src/data/meta/competitiveComps";
import { items } from "../src/data/items";
import type {
  DraftTeam,
  GameDifficulty,
  ItemCategory,
  Role,
} from "../src/types/game";
import { ROLES } from "../src/types/game";
import { generateMetaBuildForChampion } from "../src/engine/competitiveEnemyEngine";
import { simulateCampaign } from "../src/engine/simulationEngine";
import { calculateTeamScore } from "../src/engine/synergyEngine";

type TeamPreset = "strong" | "medium" | "weak";

const getChampion = (id: string) => {
  const champion = championProfiles.find((entry) => entry.id === id);
  if (!champion) throw new Error(`Champion not found: ${id}`);
  return champion;
};

const championIdsByPreset: Record<TeamPreset, string[]> = {
  strong: ["Ornn", "Vi", "Orianna", "Jinx", "Lulu"],
  medium: ["Aatrox", "LeeSin", "Ahri", "Jinx", "Lulu"],
  weak: ["Ornn", "Vi", "Orianna", "Jinx", "Lulu"],
};
const preferredCategories: Record<Role, ItemCategory[]> = {
  Top: ["Tank", "Engage", "AntiBurst"],
  Jungle: ["ObjectiveControl", "Engage", "Tank"],
  Mid: ["AP", "Controller", "WaveClear"],
  Carry: ["Marksman", "Scaling", "AntiTank"],
  Support: ["Enchanter", "Peel", "Utility"],
};

const takeItems = (role: Role, count: number, offset = 0) => {
  const preferred = preferredCategories[role];
  const ranked = [
    ...items.filter((item) => preferred.includes(item.category)),
    ...items.filter((item) => !preferred.includes(item.category)),
  ];
  return ranked.slice(offset, offset + count);
};

const createTeam = (preset: TeamPreset): DraftTeam => {
  const template = competitiveCompTemplates.find(
    (entry) => entry.id === "front-to-back-scaling",
  )!;
  const roles =
    preset === "weak"
      ? (["Carry", "Mid", "Support", "Jungle", "Top"] as Role[])
      : ROLES;

  return roles.map((role, index) => {
    const champion = getChampion(championIdsByPreset[preset][index]);
    const naturalRole = ROLES[index];
    const buildItems =
      preset === "strong"
        ? generateMetaBuildForChampion(champion, naturalRole, template, 96)
        : preset === "medium"
          ? takeItems(naturalRole, 3)
          : items
              .filter(
                (item) =>
                  !preferredCategories[naturalRole].includes(item.category),
              )
              .slice(index, index + 3);

    return {
      role,
      champion,
      items: buildItems,
    };
  });
};

const iterations = Number(process.argv[2] ?? 120);
const presets: TeamPreset[] = ["strong", "medium", "weak"];
const difficulties: GameDifficulty[] = ["Classic", "Hard"];

for (const preset of presets) {
  const team = createTeam(preset);
  for (const difficulty of difficulties) {
    const score = calculateTeamScore(team, difficulty);
    const outcomes = {
      Groups: 0,
      Quarterfinals: 0,
      Semifinals: 0,
      Final: 0,
      Champion: 0,
    };

    for (let run = 0; run < iterations; run += 1) {
      const result = simulateCampaign(team, difficulty);
      if (result.champion) outcomes.Champion += 1;
      else outcomes[result.eliminatedAt ?? "Final"] += 1;
    }

    const rates = Object.fromEntries(
      Object.entries(outcomes).map(([key, value]) => [
        key,
        `${((value / iterations) * 100).toFixed(1)}%`,
      ]),
    );
    console.log(
      JSON.stringify({
        preset,
        difficulty,
        score: score.total,
        itemization: score.metrics.itemization,
        roleFit: score.metrics.roleFit,
        outcomes: rates,
      }),
    );
  }
}
