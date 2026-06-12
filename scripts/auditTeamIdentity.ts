import { championProfiles } from "../src/data/champions/championProfiles";
import { analyzeTeamIdentity } from "../src/engine/teamIdentityEngine";
import type { DraftTeam, WinConditionKey } from "../src/types/game";
import { ROLES } from "../src/types/game";

const scenarios = {
  scalingProtect: ["Ornn", "Vi", "Orianna", "Jinx", "Lulu"],
  earlyEngage: ["Renekton", "LeeSin", "Pantheon", "Draven", "Nautilus"],
  splitMap: ["Fiora", "Nidalee", "TwistedFate", "Ezreal", "Bard"],
  pokeSiege: ["Jayce", "Nidalee", "Xerath", "Caitlyn", "Karma"],
  womboCombo: ["Malphite", "JarvanIV", "Orianna", "Twitch", "Leona"],
  protectCarry: ["Ornn", "Ivern", "Orianna", "KogMaw", "Janna"],
} as const;

const expectedPlans: Record<
  keyof typeof scenarios,
  {
    primary: WinConditionKey[];
    topPlans?: WinConditionKey[];
    minimumScores?: Partial<Record<WinConditionKey, number>>;
  }
> = {
  scalingProtect: {
    primary: ["Scaling"],
    minimumScores: { "Protect the Carry": 60 },
  },
  earlyEngage: {
    primary: ["Early Snowball", "Dive", "Hard Engage"],
  },
  splitMap: {
    primary: ["Split Push", "Map Pressure", "Pickoff"],
    topPlans: ["Split Push", "Map Pressure", "Pickoff"],
  },
  pokeSiege: {
    primary: ["Poke / Siege"],
  },
  womboCombo: {
    primary: ["Wombo Combo"],
    topPlans: ["Team Fight 5v5", "Hard Engage"],
  },
  protectCarry: {
    primary: ["Scaling", "Protect the Carry", "Front-to-Back"],
    topPlans: ["Scaling", "Protect the Carry", "Front-to-Back"],
  },
};

const createTeam = (ids: readonly string[]): DraftTeam =>
  ROLES.map((role, index) => {
    const champion = championProfiles.find((entry) => entry.id === ids[index]);
    if (!champion) throw new Error(`Champion not found: ${ids[index]}`);
    return { role, champion, items: [] };
  });

const results = Object.entries(scenarios).map(([rawName, ids]) => {
  const name = rawName as keyof typeof scenarios;
  const identity = analyzeTeamIdentity(createTeam(ids));
  const ranked = (
    Object.entries(identity.scores) as [WinConditionKey, number][]
  )
    .sort(([, left], [, right]) => right - left)
    .slice(0, 4);
  const expected = expectedPlans[name];

  if (!expected.primary.includes(identity.primaryWinCondition)) {
    throw new Error(
      `${name}: primary ${identity.primaryWinCondition} is outside ${expected.primary.join(", ")}`,
    );
  }
  expected.topPlans?.forEach((plan) => {
    if (!ranked.some(([condition]) => condition === plan)) {
      throw new Error(`${name}: missing ${plan} among top plans`);
    }
  });
  Object.entries(expected.minimumScores ?? {}).forEach(
    ([rawPlan, minimum]) => {
      const plan = rawPlan as WinConditionKey;
      if (identity.scores[plan] < (minimum ?? 0)) {
        throw new Error(
          `${name}: ${plan} scored ${identity.scores[plan]}, expected ${minimum}`,
        );
      }
    },
  );

  return {
    name,
    champions: ids,
    primary: identity.primaryWinCondition,
    confidence: identity.confidence,
    topPlans: ranked,
  };
});

console.log(JSON.stringify(results, null, 2));
