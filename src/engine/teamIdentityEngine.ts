import {
  championAttributeLabels,
  getChampionAttributeValue,
} from "../data/champions/championAttributes";
import type {
  ChampionAttributeKey,
  ChampionProfile,
  DraftTeam,
  TeamArchetype,
  TeamIdentity,
  WinConditionKey,
} from "../types/game";
import { analyzeRegionalCombo } from "./regionalComboEngine";

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
  "Early Snowball": weights(["earlyGame", 0.3], ["snowball", 0.25], ["laneBully", 0.16], ["junglePressure", 0.16], ["objectiveControl", 0.13]),
  Scaling: weights(["scaling", 0.34], ["lateGame", 0.27], ["hypercarry", 0.23], ["waveClear", 0.09], ["comeback", 0.07]),
  "Team Fight 5v5": weights(["teamFight", 0.29], ["crowdControl", 0.2], ["engage", 0.16], ["frontline", 0.14], ["dps", 0.12], ["zoneControl", 0.09]),
  "Hard Engage": weights(["engage", 0.36], ["crowdControl", 0.26], ["frontline", 0.16], ["pickoff", 0.12], ["earlyGame", 0.1]),
  "Wombo Combo": weights(["teamFight", 0.28], ["engage", 0.22], ["zoneControl", 0.19], ["crowdControl", 0.18], ["burst", 0.13]),
  "Split Push": weights(["splitPush", 0.39], ["duelist", 0.29], ["sustain", 0.12], ["mobility", 0.08], ["globalPressure", 0.12]),
  Pickoff: weights(["pickoff", 0.35], ["burst", 0.22], ["visionControl", 0.17], ["mobility", 0.14], ["crowdControl", 0.12]),
  "Poke / Siege": weights(["poke", 0.32], ["siege", 0.25], ["longRange", 0.18], ["waveClear", 0.16], ["zoneControl", 0.09]),
  Dive: weights(["dive", 0.32], ["mobility", 0.2], ["engage", 0.2], ["burst", 0.16], ["frontline", 0.12]),
  "Protect the Carry": weights(["protectCarry", 0.28], ["hypercarry", 0.22], ["peel", 0.2], ["shielding", 0.11], ["healing", 0.08], ["frontline", 0.11]),
  "Objective Control": weights(["objectiveControl", 0.24], ["junglePressure", 0.17], ["visionControl", 0.12], ["teamFight", 0.11], ["dps", 0.09], ["zoneControl", 0.08], ["earlyGame", 0.07], ["pickoff", 0.06], ["waveClear", 0.06]),
  "Dragon Stacking": weights(["objectiveControl", 0.23], ["earlyGame", 0.14], ["junglePressure", 0.17], ["teamFight", 0.1], ["visionControl", 0.09], ["dps", 0.1], ["zoneControl", 0.07], ["laneBully", 0.1]),
  "Baron Pressure": weights(["objectiveControl", 0.27], ["dps", 0.23], ["siege", 0.18], ["visionControl", 0.16], ["pickoff", 0.16]),
  "Front-to-Back": weights(["frontline", 0.28], ["dps", 0.23], ["peel", 0.2], ["teamFight", 0.16], ["scaling", 0.13]),
  "Side Lane Pressure": weights(["splitPush", 0.3], ["duelist", 0.21], ["globalPressure", 0.18], ["waveClear", 0.15], ["mobility", 0.16]),
  Skirmish: weights(["earlyGame", 0.21], ["mobility", 0.2], ["duelist", 0.19], ["junglePressure", 0.18], ["sustain", 0.12], ["burst", 0.1]),
  "Vision Control": weights(["visionControl", 0.38], ["pickoff", 0.24], ["objectiveControl", 0.17], ["crowdControl", 0.11], ["utility", 0.1]),
  Comeback: weights(["comeback", 0.34], ["scaling", 0.28], ["waveClear", 0.2], ["teamFight", 0.11], ["sustain", 0.07]),
  "Burst Composition": weights(["burst", 0.35], ["pickoff", 0.29], ["mobility", 0.16], ["visionControl", 0.11], ["snowball", 0.09]),
  "Sustain Fight": weights(["sustain", 0.3], ["healing", 0.18], ["frontline", 0.18], ["dps", 0.16], ["teamFight", 0.18]),
  "Anti-Tank": weights(["antiTank", 0.39], ["dps", 0.27], ["scaling", 0.16], ["frontline", 0.07], ["objectiveControl", 0.11]),
  "Map Pressure": weights(["globalPressure", 0.27], ["roaming", 0.24], ["mobility", 0.18], ["waveClear", 0.15], ["objectiveControl", 0.16]),
};

const mountainCompChampionIds = new Set([
  "Malphite",
  "JarvanIV",
  "Orianna",
  "Twitch",
  "Leona",
]);

const getIdentityDisplayName = (
  team: DraftTeam,
  primaryWinCondition: WinConditionKey,
) => {
  const isMountainComp =
    team.length === mountainCompChampionIds.size &&
    team.every(({ champion }) => mountainCompChampionIds.has(champion.id));
  return isMountainComp ? "Comp do Montanha" : primaryWinCondition;
};

const legacyMap: Record<WinConditionKey, TeamArchetype> = {
  "Early Snowball": "Early Snowball",
  Scaling: "Scaling",
  "Team Fight 5v5": "Team Fight",
  "Hard Engage": "Team Fight",
  "Wombo Combo": "Team Fight",
  "Split Push": "Split Push",
  Pickoff: "Pickoff",
  "Poke / Siege": "Poke",
  Dive: "Team Fight",
  "Protect the Carry": "Protect the Carry",
  "Objective Control": "Balanced",
  "Dragon Stacking": "Early Snowball",
  "Baron Pressure": "Poke",
  "Front-to-Back": "Protect the Carry",
  "Side Lane Pressure": "Split Push",
  Skirmish: "Early Snowball",
  "Vision Control": "Pickoff",
  Comeback: "Scaling",
  "Burst Composition": "Pickoff",
  "Sustain Fight": "Team Fight",
  "Anti-Tank": "Scaling",
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

const strategicAttributeKeys = (
  Object.keys(championAttributeLabels) as ChampionAttributeKey[]
).filter(
  (key) =>
    ![
      "tank",
      "fighter",
      "mage",
      "assassin",
      "marksman",
      "support",
      "enchanter",
      "controller",
      "backline",
    ].includes(key),
);

type AttributeEvidence = {
  score: number;
  average: number;
  peak: number;
  relevant: number;
  strong: number;
};

const buildTeamEvidence = (
  team: DraftTeam,
): Partial<Record<ChampionAttributeKey, AttributeEvidence>> =>
  Object.fromEntries(
    strategicAttributeKeys.map((key) => {
      const values = team.map(({ champion }) => getChampionAttributeValue(champion, key));
      const relevant = values.filter((value) => value >= 58).length;
      const strong = values.filter((value) => value >= 76).length;
      return [
        key,
        {
          score: clamp(
            average(values) * 0.5 +
              Math.max(...values, 0) * 0.22 +
              relevant * 1.6 +
              strong * 5,
          ),
          average: average(values),
          peak: Math.max(...values, 0),
          relevant,
          strong,
        },
      ];
    }),
  );

export function aggregateTeamAttributes(
  team: DraftTeam,
): Partial<Record<ChampionAttributeKey, number>> {
  if (!team.length) return {};
  return Object.fromEntries(
    Object.entries(buildTeamEvidence(team)).map(([key, evidence]) => [
      key,
      evidence?.score ?? 0,
    ]),
  );
}

const championContribution = (
  champion: ChampionProfile,
  keys: ChampionAttributeKey[],
): number => Math.max(...keys.map((key) => getChampionAttributeValue(champion, key)), 0);

const countContributors = (
  team: DraftTeam,
  keys: ChampionAttributeKey[],
  threshold = 76,
) =>
  team.filter(({ champion }) => championContribution(champion, keys) >= threshold).length;

const scoreCondition = (
  profile: Partial<Record<ChampionAttributeKey, number>>,
  condition: WinConditionKey,
) =>
  Object.entries(winConditionWeights[condition]).reduce(
    (sum, [key, weight]) =>
      sum + (profile[key as ChampionAttributeKey] ?? 0) * (weight ?? 0),
    0,
  );

const capIfMissing = (score: number, hasStructure: boolean, cap: number) =>
  hasStructure ? score : Math.min(score, cap);

const applyStructuralRules = (
  condition: WinConditionKey,
  baseScore: number,
  team: DraftTeam,
) => {
  const contributors = (
    keys: ChampionAttributeKey[],
    threshold = 76,
  ) => countContributors(team, keys, threshold);
  let score = baseScore;

  switch (condition) {
    case "Early Snowball": {
      const pressure = contributors(["earlyGame", "snowball", "laneBully", "junglePressure"]);
      score = capIfMissing(score + pressure * 2.2, pressure >= 2, 49);
      break;
    }
    case "Scaling": {
      const carries = contributors(["scaling", "lateGame", "hypercarry"], 82);
      const survival = contributors(["frontline", "peel", "disengage", "protectCarry"], 78);
      score = capIfMissing(score - 5 + carries * 2.5, carries >= 2, 43);
      score += survival >= 2 ? 7 : survival === 1 ? 1 : -9;
      break;
    }
    case "Team Fight 5v5": {
      const fighters = contributors(["teamFight", "crowdControl", "zoneControl"], 78);
      const structure = contributors(["engage", "frontline", "peel"], 78);
      score = capIfMissing(score + fighters * 1.8 + Math.min(5, structure * 2), fighters >= 2, 51);
      break;
    }
    case "Hard Engage": {
      const initiators = contributors(["engage", "crowdControl"], 84);
      const followUp = contributors(["teamFight", "burst", "dive"], 78);
      score = capIfMissing(score + initiators * 3 + Math.min(5, followUp * 1.5), initiators >= 2, 46);
      break;
    }
    case "Wombo Combo": {
      const initiators = contributors(["engage"], 86);
      const comboPieces = contributors(["teamFight", "zoneControl", "crowdControl", "burst"], 82);
      score = capIfMissing(score + initiators * 3 + comboPieces * 1.8, initiators >= 1 && comboPieces >= 3, 48);
      break;
    }
    case "Split Push": {
      const sideLaners = contributors(["splitPush", "duelist"], 84);
      const mapSupport = contributors(["globalPressure", "roaming", "waveClear", "mobility"], 78);
      score = capIfMissing(
        score +
          sideLaners * 10 +
          Math.min(8, mapSupport * 2) +
          (sideLaners >= 1 && mapSupport >= 3 ? 10 : 0),
        sideLaners >= 1,
        42,
      );
      break;
    }
    case "Pickoff": {
      const catchTools = contributors(["pickoff", "burst", "visionControl", "crowdControl"], 82);
      score = capIfMissing(score + catchTools * 2.3, catchTools >= 2, 48);
      break;
    }
    case "Poke / Siege": {
      const rangedPressure = contributors(["poke", "siege", "longRange"], 82);
      const waveControl = contributors(["waveClear"], 76);
      score = capIfMissing(score + rangedPressure * 2.6 + Math.min(4, waveControl), rangedPressure >= 2, 46);
      if (rangedPressure >= 3) score += 5;
      break;
    }
    case "Dive": {
      const divers = contributors(["dive", "mobility", "engage", "burst"], 84);
      const setup = contributors(["engage", "frontline", "crowdControl"], 80);
      score = capIfMissing(score + divers * 2.2 + Math.min(5, setup * 1.4), divers >= 3, 48);
      break;
    }
    case "Protect the Carry": {
      const carries = contributors(["hypercarry"], 84);
      const protectors = contributors(["protectCarry", "peel", "shielding", "healing"], 80);
      const survival = contributors(["frontline", "disengage"], 80);
      score = capIfMissing(score + carries * 7 + protectors * 4, carries >= 1 && protectors >= 2, 43);
      score += survival >= 1 ? 6 : -5;
      break;
    }
    case "Objective Control":
    case "Dragon Stacking": {
      const controllers = contributors(
        ["objectiveControl", "junglePressure", "visionControl"],
        76,
      );
      const objectiveFight = contributors(
        ["teamFight", "zoneControl", "pickoff", "crowdControl"],
        76,
      );
      const damage = contributors(["dps", "antiTank", "siege"], 76);
      const jungle = team.find(({ role }) => role === "Jungle");
      const jungleReady = Boolean(
        jungle &&
          championContribution(jungle.champion, [
            "objectiveControl",
            "junglePressure",
          ]) >= 74,
      );
      score = capIfMissing(
        score +
          controllers * 1.8 +
          objectiveFight * 1.1 +
          damage * 0.9 +
          (jungleReady ? 7 : -5),
        jungleReady && controllers >= 2 && (objectiveFight >= 2 || damage >= 2),
        47,
      );
      if (condition === "Dragon Stacking") {
        const botPriority = team
          .filter(({ role }) => role === "Carry" || role === "Support")
          .filter(
            ({ champion }) =>
              championContribution(champion, [
                "earlyGame",
                "laneBully",
                "dps",
                "engage",
                "visionControl",
              ]) >= 74,
          ).length;
        score += botPriority * 1.5 - 3;
      }
      break;
    }
    case "Baron Pressure": {
      const damage = contributors(["dps", "antiTank", "siege"], 80);
      const setup = contributors(["objectiveControl", "visionControl", "pickoff"], 78);
      score = capIfMissing(score + damage * 1.7 + setup * 1.3 - 3, damage >= 2 && setup >= 1, 47);
      break;
    }
    case "Front-to-Back": {
      const frontline = contributors(["frontline"], 82);
      const carries = contributors(["dps", "hypercarry"], 84);
      const protection = contributors(["peel", "protectCarry"], 80);
      score = capIfMissing(score + frontline * 3 + carries * 2 + protection * 2, frontline >= 1 && carries >= 1 && protection >= 1, 45);
      break;
    }
    case "Side Lane Pressure": {
      const sideLaners = contributors(["splitPush", "duelist"], 82);
      const mapTools = contributors(["globalPressure", "roaming", "waveClear", "mobility"], 78);
      score = capIfMissing(score + sideLaners * 4 + mapTools * 1.6, sideLaners >= 1 && mapTools >= 2, 45);
      break;
    }
    case "Skirmish": {
      const skirmishers = contributors(["earlyGame", "mobility", "duelist", "junglePressure"], 80);
      score = capIfMissing(score + skirmishers * 2, skirmishers >= 3, 48);
      break;
    }
    case "Vision Control": {
      const vision = contributors(["visionControl"], 80);
      const punish = contributors(["pickoff", "crowdControl"], 80);
      score = capIfMissing(score + vision * 3 + punish * 1.4 - 4, vision >= 2 && punish >= 1, 44);
      break;
    }
    case "Comeback": {
      const scaling = contributors(["scaling", "lateGame", "hypercarry"], 84);
      const waveClear = contributors(["waveClear"], 78);
      const survival = contributors(["frontline", "peel", "disengage", "sustain"], 80);
      score = capIfMissing(score - 8 + scaling * 2 + waveClear + survival, scaling >= 2 && waveClear >= 2 && survival >= 2, 38);
      break;
    }
    case "Burst Composition": {
      const burst = contributors(["burst"], 86);
      const pickoff = contributors(["pickoff"], 82);
      const access = contributors(["mobility", "visionControl", "crowdControl"], 80);
      score = capIfMissing(
        score + burst * 2.3 + pickoff + access,
        burst >= 3 || (burst >= 2 && pickoff >= 2),
        47,
      );
      break;
    }
    case "Sustain Fight": {
      const sustain = contributors(["sustain", "healing"], 82);
      const longFight = contributors(["frontline", "dps", "teamFight"], 80);
      score = capIfMissing(score + sustain * 2.7 + longFight * 1.2, sustain >= 2 && longFight >= 2, 46);
      break;
    }
    case "Anti-Tank": {
      const shredders = contributors(["antiTank"], 84);
      const damage = contributors(["dps"], 82);
      score = capIfMissing(score + shredders * 4 + damage * 1.5 - 3, shredders >= 1 && damage >= 2, 44);
      break;
    }
    case "Map Pressure": {
      const mapPlayers = contributors(["globalPressure", "roaming"], 82);
      const tempo = contributors(["mobility", "waveClear", "objectiveControl"], 78);
      score = capIfMissing(
        score +
          mapPlayers * 4 +
          tempo * 1.5 +
          (mapPlayers >= 2 && tempo >= 3 ? 4 : 0),
        mapPlayers >= 2 && tempo >= 2,
        46,
      );
      break;
    }
  }

  return clamp(score);
};

export function analyzeTeamIdentity(team: DraftTeam): TeamIdentity {
  const attributeProfile = aggregateTeamAttributes(team);
  const regionalCombo = analyzeRegionalCombo(team);
  const scores = Object.fromEntries(
    (Object.keys(winConditionWeights) as WinConditionKey[]).map((condition) => [
      condition,
      applyStructuralRules(
        condition,
        scoreCondition(attributeProfile, condition),
        team,
      ),
    ]),
  ) as Record<WinConditionKey, number>;
  const ranked = (Object.entries(scores) as [WinConditionKey, number][]).sort(
    ([, left], [, right]) => right - left,
  );
  const primaryWinCondition = ranked[0]?.[0] ?? "Team Fight 5v5";
  const secondaryWinConditions = ranked
    .slice(1)
    .filter(([, score]) => score >= Math.max(46, ranked[0][1] - 11))
    .slice(0, 2)
    .map(([condition]) => condition);
  const strengths = strengthLabels
    .map(([key, label]) => ({ label, value: attributeProfile[key] ?? 0 }))
    .filter(({ value }) => value >= 56)
    .sort((left, right) => right.value - left.value)
    .slice(0, 3)
    .map(({ label }) => label);
  const weaknesses = strengthLabels
    .map(([key, label]) => ({ label, value: attributeProfile[key] ?? 0 }))
    .filter(({ value }) => value < 35)
    .sort((left, right) => left.value - right.value)
    .slice(0, 2)
    .map(({ label }) => `Pouco ${label.toLowerCase()}`);
  const topAttributes = strategicAttributeKeys
    .map((key) => ({
      key,
      label: championAttributeLabels[key],
      value: attributeProfile[key] ?? 0,
    }))
    .filter(({ value }) => value >= 45)
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label))
    .slice(0, 3);
  const physical = average(team.map(({ champion }) => champion.stats.damageAD));
  const magic = average(team.map(({ champion }) => champion.stats.damageAP));
  const highRisk = attributeProfile.highRisk ?? 0;
  const frontline = attributeProfile.frontline ?? 0;
  const peel = attributeProfile.peel ?? 0;
  const early = attributeProfile.earlyGame ?? 0;
  const scaling = attributeProfile.scaling ?? 0;

  return {
    primaryWinCondition,
    displayName: getIdentityDisplayName(team, primaryWinCondition),
    regionalCombo,
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
    topAttributes,
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
  if (
    user.primaryWinCondition === "Team Fight 5v5" ||
    user.primaryWinCondition === "Wombo Combo"
  ) {
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
