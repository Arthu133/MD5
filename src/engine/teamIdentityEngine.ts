import { getChampionAttributeValue } from "../data/champions/championAttributes";
import type {
  ChampionAttributeKey,
  DraftTeam,
  TeamArchetype,
  TeamIdentity,
  WinConditionKey,
} from "../types/game";

const clamp = (value: number) => Math.round(Math.max(0, Math.min(100, value)));
const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const weights = (
  ...entries: [ChampionAttributeKey, number][]
): Partial<Record<ChampionAttributeKey, number>> => Object.fromEntries(entries);

const winConditionWeights: Record<
  WinConditionKey,
  Partial<Record<ChampionAttributeKey, number>>
> = {
  "Early Snowball": weights(["earlyGame", 0.3], ["snowball", 0.25], ["laneBully", 0.15], ["junglePressure", 0.16], ["objectiveControl", 0.14]),
  "Late Game Scaling": weights(["scaling", 0.35], ["lateGame", 0.28], ["hypercarry", 0.2], ["waveClear", 0.1], ["comeback", 0.07]),
  "Team Fight 5v5": weights(["teamFight", 0.28], ["engage", 0.18], ["crowdControl", 0.18], ["frontline", 0.16], ["dps", 0.12], ["zoneControl", 0.08]),
  "Split Push": weights(["splitPush", 0.38], ["duelist", 0.27], ["sustain", 0.12], ["mobility", 0.1], ["globalPressure", 0.13]),
  Pickoff: weights(["pickoff", 0.34], ["burst", 0.23], ["visionControl", 0.15], ["mobility", 0.15], ["crowdControl", 0.13]),
  "Poke / Siege": weights(["poke", 0.3], ["siege", 0.24], ["longRange", 0.17], ["waveClear", 0.17], ["zoneControl", 0.12]),
  "Dive / Engage": weights(["dive", 0.28], ["engage", 0.25], ["mobility", 0.18], ["burst", 0.16], ["frontline", 0.13]),
  "Protect the Carry": weights(["protectCarry", 0.27], ["hypercarry", 0.2], ["peel", 0.19], ["shielding", 0.12], ["healing", 0.1], ["frontline", 0.12]),
  "Objective Control": weights(["objectiveControl", 0.37], ["junglePressure", 0.2], ["visionControl", 0.15], ["teamFight", 0.14], ["earlyGame", 0.14]),
  "Dragon Stacking": weights(["objectiveControl", 0.36], ["earlyGame", 0.2], ["junglePressure", 0.2], ["teamFight", 0.14], ["visionControl", 0.1]),
  "Baron Pressure": weights(["objectiveControl", 0.28], ["dps", 0.22], ["siege", 0.17], ["visionControl", 0.16], ["pickoff", 0.17]),
  "Front-to-Back": weights(["frontline", 0.27], ["dps", 0.23], ["peel", 0.18], ["teamFight", 0.17], ["scaling", 0.15]),
  "Side Lane Pressure": weights(["splitPush", 0.28], ["duelist", 0.2], ["globalPressure", 0.18], ["waveClear", 0.16], ["mobility", 0.18]),
  Skirmish: weights(["earlyGame", 0.2], ["mobility", 0.2], ["duelist", 0.2], ["junglePressure", 0.18], ["sustain", 0.12], ["burst", 0.1]),
  "Vision Control": weights(["visionControl", 0.36], ["pickoff", 0.24], ["objectiveControl", 0.18], ["crowdControl", 0.12], ["utility", 0.1]),
  "Comeback Scaling": weights(["comeback", 0.31], ["scaling", 0.28], ["waveClear", 0.2], ["teamFight", 0.13], ["sustain", 0.08]),
  "Burst / Pick": weights(["burst", 0.32], ["pickoff", 0.3], ["mobility", 0.16], ["visionControl", 0.12], ["snowball", 0.1]),
  "Sustain Fight": weights(["sustain", 0.3], ["healing", 0.18], ["frontline", 0.18], ["dps", 0.16], ["teamFight", 0.18]),
  "Anti-Tank Scaling": weights(["antiTank", 0.35], ["dps", 0.25], ["scaling", 0.2], ["frontline", 0.08], ["objectiveControl", 0.12]),
  "Map Pressure": weights(["globalPressure", 0.25], ["roaming", 0.22], ["mobility", 0.18], ["waveClear", 0.17], ["objectiveControl", 0.18]),
};

const legacyMap: Record<WinConditionKey, TeamArchetype> = {
  "Early Snowball": "Early Snowball",
  "Late Game Scaling": "Scaling",
  "Team Fight 5v5": "Team Fight",
  "Split Push": "Split Push",
  Pickoff: "Pickoff",
  "Poke / Siege": "Poke",
  "Dive / Engage": "Team Fight",
  "Protect the Carry": "Protect the Carry",
  "Objective Control": "Balanced",
  "Dragon Stacking": "Early Snowball",
  "Baron Pressure": "Poke",
  "Front-to-Back": "Protect the Carry",
  "Side Lane Pressure": "Split Push",
  Skirmish: "Early Snowball",
  "Vision Control": "Pickoff",
  "Comeback Scaling": "Scaling",
  "Burst / Pick": "Pickoff",
  "Sustain Fight": "Team Fight",
  "Anti-Tank Scaling": "Scaling",
  "Map Pressure": "Split Push",
};

const strengthLabels: [ChampionAttributeKey, string][] = [
  ["frontline", "Frontline resistente"],
  ["dps", "Dano constante"],
  ["engage", "Iniciacao confiavel"],
  ["peel", "Protecao dos carregadores"],
  ["objectiveControl", "Controle de objetivos"],
  ["splitPush", "Pressao lateral"],
  ["poke", "Alcance e desgaste"],
  ["pickoff", "Criacao de pickoffs"],
  ["scaling", "Escalamento tardio"],
  ["mobility", "Mobilidade no mapa"],
  ["sustain", "Sustain em lutas longas"],
  ["waveClear", "Controle de ondas"],
];

export function aggregateTeamAttributes(
  team: DraftTeam,
): Partial<Record<ChampionAttributeKey, number>> {
  if (!team.length) return {};
  const keys = new Set(team.flatMap(({ champion }) => champion.attributes.map(({ key }) => key)));
  return Object.fromEntries(
    [...keys].map((key) => {
      const values = team.map(({ champion }) => getChampionAttributeValue(champion, key));
      const specialists = values.filter((value) => value >= 72).length;
      const score = average(values) * 0.68 + Math.max(...values) * 0.2 + Math.min(12, specialists * 4);
      return [key, clamp(score)];
    }),
  );
}

const scoreCondition = (
  profile: Partial<Record<ChampionAttributeKey, number>>,
  condition: WinConditionKey,
) =>
  clamp(
    Object.entries(winConditionWeights[condition]).reduce(
      (sum, [key, weight]) => sum + (profile[key as ChampionAttributeKey] ?? 0) * (weight ?? 0),
      0,
    ),
  );

export function analyzeTeamIdentity(team: DraftTeam): TeamIdentity {
  const attributeProfile = aggregateTeamAttributes(team);
  const scores = Object.fromEntries(
    (Object.keys(winConditionWeights) as WinConditionKey[]).map((condition) => [
      condition,
      scoreCondition(attributeProfile, condition),
    ]),
  ) as Record<WinConditionKey, number>;
  const ranked = (Object.entries(scores) as [WinConditionKey, number][]).sort(
    ([, left], [, right]) => right - left,
  );
  const primaryWinCondition = ranked[0]?.[0] ?? "Team Fight 5v5";
  const secondaryWinConditions = ranked
    .slice(1)
    .filter(([, score]) => score >= Math.max(48, ranked[0][1] - 12))
    .slice(0, 2)
    .map(([condition]) => condition);
  const strengths = strengthLabels
    .map(([key, label]) => ({ label, value: attributeProfile[key] ?? 0 }))
    .filter(({ value }) => value >= 58)
    .sort((left, right) => right.value - left.value)
    .slice(0, 3)
    .map(({ label }) => label);
  const weaknesses = strengthLabels
    .map(([key, label]) => ({ label, value: attributeProfile[key] ?? 0 }))
    .filter(({ value }) => value < 38)
    .sort((left, right) => left.value - right.value)
    .slice(0, 2)
    .map(({ label }) => `Pouco ${label.toLowerCase()}`);
  const physical = average(team.map(({ champion }) => champion.stats.damageAD));
  const magic = average(team.map(({ champion }) => champion.stats.damageAP));
  const highRisk = attributeProfile.highRisk ?? 0;
  const frontline = attributeProfile.frontline ?? 0;
  const peel = attributeProfile.peel ?? 0;
  const early = attributeProfile.earlyGame ?? 0;
  const scaling = attributeProfile.scaling ?? 0;

  return {
    primaryWinCondition,
    secondaryWinConditions,
    strengths,
    weaknesses,
    riskLevel:
      highRisk >= 58 || (frontline < 32 && peel < 36)
        ? "High"
        : highRisk >= 38 || frontline < 45
          ? "Medium"
          : "Low",
    scalingProfile:
      scaling >= early + 8 ? "Late game" : early >= scaling + 8 ? "Early game" : "Mid game",
    damageProfile:
      Math.abs(physical - magic) <= 18
        ? "Mixed"
        : physical >= magic + 18
          ? "Physical"
          : magic >= physical + 18
            ? "Magic"
            : "Utility",
    confidence: clamp(ranked[0][1] * 0.7 + Math.max(0, ranked[0][1] - (ranked[1]?.[1] ?? 0)) * 1.8),
    scores,
    attributeProfile,
    legacyArchetype: legacyMap[primaryWinCondition],
  };
}

export function calculateIdentityMatchupAdvantage(
  user: TeamIdentity,
  enemy: TeamIdentity,
): number {
  let advantage = 0;
  const userProfile = user.attributeProfile;
  const enemyProfile = enemy.attributeProfile;
  if (user.primaryWinCondition === "Split Push" || user.primaryWinCondition === "Side Lane Pressure") {
    advantage += ((userProfile.duelist ?? 0) - (enemyProfile.engage ?? 0)) * 0.035;
    advantage -= (enemyProfile.waveClear ?? 0) * 0.018;
  }
  if (user.primaryWinCondition === "Poke / Siege") {
    advantage += ((userProfile.poke ?? 0) - (enemyProfile.sustain ?? 0)) * 0.035;
    advantage -= (enemyProfile.engage ?? 0) * 0.02;
  }
  if (user.primaryWinCondition === "Protect the Carry") {
    advantage += ((userProfile.peel ?? 0) - (enemyProfile.pickoff ?? 0)) * 0.03;
  }
  if (user.primaryWinCondition === "Team Fight 5v5") {
    advantage += ((userProfile.teamFight ?? 0) - (enemyProfile.teamFight ?? 0)) * 0.025;
  }
  return Math.max(-4, Math.min(4, advantage));
}

export function getIdentityPhaseBonus(identity: TeamIdentity, minute: number): number {
  const profile = identity.attributeProfile;
  const value =
    minute < 15
      ? (profile.earlyGame ?? 0) * 0.04 + (profile.snowball ?? 0) * 0.025
      : minute >= 28
        ? (profile.scaling ?? 0) * 0.035 + (profile.lateGame ?? 0) * 0.03
        : Math.max(profile.teamFight ?? 0, profile.pickoff ?? 0, profile.splitPush ?? 0) * 0.045;
  return Math.max(-2, Math.min(4, value - 2.2));
}
