import { getChampionAttributeValue } from "../data/champions/championAttributes";
import type {
  ActiveRogueCard,
  ChampionAttributeKey,
  ChampionBuild,
  DraftTeam,
  GameDifficulty,
  RogueCardContextImpact,
  TeamScore,
  TournamentStage,
  WinConditionKey,
} from "../types/game";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const average = (values: number[]) =>
  values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;

const valueFor = (
  build: ChampionBuild | undefined,
  key: ChampionAttributeKey,
) => (build ? getChampionAttributeValue(build.champion, key) : 0);

const roleBuild = (team: DraftTeam, role: ChampionBuild["role"]) =>
  team.find((build) => build.role === role);

const roleAverage = (
  team: DraftTeam,
  role: ChampionBuild["role"],
  keys: ChampionAttributeKey[],
) => {
  const build = roleBuild(team, role);
  return average(keys.map((key) => valueFor(build, key)));
};

const planKeys: Record<WinConditionKey, ChampionAttributeKey[]> = {
  "Early Snowball": ["earlyGame", "snowball", "laneBully", "junglePressure"],
  Scaling: ["scaling", "lateGame", "hypercarry", "waveClear"],
  "Team Fight 5v5": ["teamFight", "engage", "crowdControl", "dps"],
  "Hard Engage": ["engage", "crowdControl", "frontline", "burst"],
  "Wombo Combo": ["teamFight", "engage", "zoneControl", "burst"],
  "Split Push": ["splitPush", "duelist", "sustain", "globalPressure"],
  Pickoff: ["pickoff", "burst", "visionControl", "mobility"],
  "Poke / Siege": ["poke", "siege", "longRange", "waveClear"],
  Dive: ["dive", "engage", "mobility", "burst"],
  "Protect the Carry": ["protectCarry", "hypercarry", "peel", "shielding"],
  "Objective Control": [
    "objectiveControl",
    "junglePressure",
    "visionControl",
    "zoneControl",
  ],
  "Dragon Stacking": [
    "objectiveControl",
    "junglePressure",
    "earlyGame",
    "dps",
  ],
  "Baron Pressure": ["objectiveControl", "dps", "visionControl", "siege"],
  "Front-to-Back": ["frontline", "dps", "peel", "teamFight"],
  "Side Lane Pressure": [
    "splitPush",
    "duelist",
    "globalPressure",
    "waveClear",
  ],
  Skirmish: ["earlyGame", "mobility", "duelist", "junglePressure"],
  "Vision Control": [
    "visionControl",
    "pickoff",
    "objectiveControl",
    "utility",
  ],
  Comeback: ["comeback", "scaling", "waveClear", "teamFight"],
  "Burst Composition": ["burst", "pickoff", "mobility", "visionControl"],
  "Sustain Fight": ["sustain", "healing", "frontline", "dps"],
  "Anti-Tank": ["antiTank", "dps", "scaling", "objectiveControl"],
  "Map Pressure": ["globalPressure", "roaming", "waveClear", "mobility"],
};

const championPlanValue = (
  build: ChampionBuild,
  condition: WinConditionKey,
) => average(planKeys[condition].map((key) => valueFor(build, key)));

const addAdvantage = (impact: RogueCardContextImpact, value: number) => {
  if (value >= 0) impact.userPowerDelta += value;
  else impact.enemyPowerDelta += Math.abs(value);
};

const addObjectiveAdvantage = (
  impact: RogueCardContextImpact,
  value: number,
) => {
  if (value >= 0) impact.userObjectivePower += value;
  else impact.enemyObjectivePower += Math.abs(value);
};

const captainCounterScore = (
  captain: ChampionBuild,
  enemyScore: TeamScore,
) => {
  const profile = enemyScore.identity.attributeProfile;
  const carryCaptain = Math.max(
    valueFor(captain, "hypercarry"),
    valueFor(captain, "backline"),
  );
  const sideCaptain = Math.max(
    valueFor(captain, "splitPush"),
    valueFor(captain, "duelist"),
  );
  const engageCaptain = Math.max(
    valueFor(captain, "engage"),
    valueFor(captain, "dive"),
  );

  if (carryCaptain >= 72) {
    return average([
      profile.pickoff ?? 0,
      profile.dive ?? 0,
      profile.burst ?? 0,
    ]);
  }
  if (sideCaptain >= 72) {
    return average([
      profile.engage ?? 0,
      profile.waveClear ?? 0,
      profile.globalPressure ?? 0,
    ]);
  }
  if (engageCaptain >= 72) {
    return average([
      profile.disengage ?? 0,
      profile.peel ?? 0,
      profile.frontline ?? 0,
    ]);
  }
  return average([profile.pickoff ?? 0, profile.crowdControl ?? 0]);
};

const jungleScore = (team: DraftTeam) =>
  roleAverage(team, "Jungle", [
    "junglePressure",
    "objectiveControl",
    "earlyGame",
    "mobility",
  ]) *
    0.72 +
  average([
    roleAverage(team, "Mid", ["waveClear", "roaming", "earlyGame"]),
    roleAverage(team, "Support", [
      "visionControl",
      "crowdControl",
      "engage",
    ]),
  ]) *
    0.28;

const botScore = (team: DraftTeam) => {
  const carryPressure = roleAverage(team, "Carry", [
    "dps",
    "hypercarry",
    "earlyGame",
    "laneBully",
  ]);
  const protection = roleAverage(team, "Support", [
    "peel",
    "protectCarry",
    "shielding",
    "healing",
  ]);
  const aggression = roleAverage(team, "Support", [
    "engage",
    "crowdControl",
    "earlyGame",
    "visionControl",
  ]);
  const carry = roleBuild(team, "Carry");
  const carryScaling = Math.max(
    valueFor(carry, "hypercarry"),
    valueFor(carry, "scaling"),
  );
  const carryEarly = Math.max(
    valueFor(carry, "earlyGame"),
    valueFor(carry, "laneBully"),
  );
  const laneSynergy = Math.max(
    average([carryScaling, protection]),
    average([carryEarly, aggression]),
  );
  return carryPressure * 0.45 + laneSynergy * 0.55;
};

const topScore = (team: DraftTeam) =>
  roleAverage(team, "Top", [
    "splitPush",
    "duelist",
    "sustain",
    "scaling",
  ]) *
    0.76 +
  average([
    roleAverage(team, "Mid", ["waveClear", "globalPressure"]),
    roleAverage(team, "Support", ["disengage", "pickoff"]),
  ]) *
    0.24;

const midScore = (team: DraftTeam) =>
  roleAverage(team, "Mid", [
    "roaming",
    "waveClear",
    "pickoff",
    "burst",
    "zoneControl",
    "utility",
  ]) *
    0.75 +
  roleAverage(team, "Jungle", [
    "junglePressure",
    "objectiveControl",
    "earlyGame",
  ]) *
    0.25;

export function evaluateRogueCardContext(input: {
  userTeam: DraftTeam;
  enemyTeam: DraftTeam;
  userScore: TeamScore;
  enemyScore: TeamScore;
  activeCards: ActiveRogueCard[];
  difficulty: GameDifficulty;
  stage: TournamentStage;
  seriesUserWins: number;
  seriesEnemyWins: number;
}): RogueCardContextImpact {
  const impact: RogueCardContextImpact = {
    userPowerDelta: 0,
    enemyPowerDelta: 0,
    userObjectivePower: 0,
    enemyObjectivePower: 0,
    fightChanceMultiplier: 1,
    varianceMultiplier: 1,
    lateGameUserBias: 0,
    userLanePressure: {},
  };

  input.activeCards.forEach(({ card }) => {
    switch (card.mechanic) {
      case "TeamCaptain": {
        const ranked = input.userTeam
          .map((build) => ({
            build,
            value: championPlanValue(
              build,
              input.userScore.identity.primaryWinCondition,
            ),
          }))
          .sort((left, right) => right.value - left.value);
        const captain = ranked[0];
        if (!captain) break;
        const support = ranked.slice(1).filter(({ value }) => value >= 58).length;
        const counter = captainCounterScore(captain.build, input.enemyScore);
        const value =
          (captain.value - 55) * 0.045 +
          (input.userScore.identity.confidence - 50) * 0.025 +
          support * 0.42 -
          Math.max(0, counter - 58) * 0.04;
        addAdvantage(impact, clamp(value, -2.2, 4.2));
        impact.captainName = captain.build.champion.name;
        break;
      }
      case "LastChance": {
        if (
          input.stage === "Groups" ||
          input.seriesEnemyWins <= input.seriesUserWins
        ) {
          break;
        }
        const tools = average([
          input.userScore.identity.scores.Comeback,
          input.userScore.identity.scores.Scaling,
          input.userScore.identity.scores["Team Fight 5v5"],
          input.userScore.identity.scores.Pickoff,
          input.userScore.metrics.objectiveControl,
        ]);
        const deficit = input.seriesEnemyWins - input.seriesUserWins;
        addAdvantage(
          impact,
          clamp((tools - 40) * 0.055 + deficit * 0.7, 0.4, 4.2),
        );
        impact.lateGameUserBias += clamp((tools - 45) * 0.035, 0, 2.2);
        break;
      }
      case "RecklessDive": {
        const userDive = average([
          input.userScore.identity.scores.Dive,
          input.userScore.metrics.engage,
          input.userScore.identity.attributeProfile.burst ?? 0,
          input.userScore.identity.attributeProfile.mobility ?? 0,
        ]);
        const followUp = average([
          input.userScore.metrics.teamFight,
          Math.max(
            input.userScore.metrics.physicalDamage,
            input.userScore.metrics.magicDamage,
          ),
        ]);
        const enemyAnswer = average([
          input.enemyScore.metrics.peel,
          input.enemyScore.metrics.frontline,
          input.enemyScore.identity.attributeProfile.disengage ?? 0,
        ]);
        const executionRisk = average([
          input.userScore.metrics.executionDifficulty,
          input.userScore.identity.attributeProfile.highRisk ?? 0,
        ]);
        const value =
          (userDive - enemyAnswer) * 0.035 +
          (followUp - 55) * 0.035 -
          Math.max(0, executionRisk - 65) * 0.035;
        addAdvantage(impact, clamp(value, -3.2, 3.5));
        impact.fightChanceMultiplier *= 1.22;
        impact.varianceMultiplier *= 1.14;
        break;
      }
      case "LegendaryDraft": {
        const primary =
          input.userScore.identity.scores[
            input.userScore.identity.primaryWinCondition
          ];
        const contributors = input.userTeam.filter(
          (build) =>
            championPlanValue(
              build,
              input.userScore.identity.primaryWinCondition,
            ) >= 60,
        ).length;
        const value =
          Math.max(0, input.userScore.identity.confidence - 48) * 0.045 +
          Math.max(0, primary - 55) * 0.04 +
          Math.max(0, contributors - 2) * 0.65 -
          input.userScore.identity.weaknesses.length * 0.25;
        addAdvantage(impact, clamp(value, 0, 4.6));
        if (
          ["Objective Control", "Dragon Stacking", "Baron Pressure"].includes(
            input.userScore.identity.primaryWinCondition,
          )
        ) {
          impact.userObjectivePower += clamp(value * 0.7, 0, 2.5);
        }
        break;
      }
      case "FatalError": {
        const setupDifference =
          average([
            input.userScore.identity.attributeProfile.visionControl ?? 0,
            input.userScore.metrics.pickoff,
            input.userScore.metrics.engage,
            input.userScore.metrics.objectiveControl,
            input.userScore.metrics.consistency,
          ]) -
          average([
            input.enemyScore.identity.attributeProfile.visionControl ?? 0,
            input.enemyScore.metrics.pickoff,
            input.enemyScore.metrics.engage,
            input.enemyScore.metrics.objectiveControl,
            input.enemyScore.metrics.consistency,
          ]);
        const executionDifference =
          input.enemyScore.metrics.executionDifficulty -
          input.userScore.metrics.executionDifficulty;
        const value = clamp(
          setupDifference * 0.035 + executionDifference * 0.025,
          -3,
          3,
        );
        addAdvantage(impact, value);
        impact.lateGameUserBias += value;
        impact.varianceMultiplier *= 1.1;
        break;
      }
      case "JungleFocus": {
        const difference = jungleScore(input.userTeam) - jungleScore(input.enemyTeam);
        const value = clamp(difference * 0.065, -3.8, 3.8);
        addAdvantage(impact, value);
        addObjectiveAdvantage(impact, clamp(difference * 0.06, -4, 4));
        break;
      }
      case "BotFocus": {
        const difference = botScore(input.userTeam) - botScore(input.enemyTeam);
        const value = clamp(difference * 0.055, -3.5, 3.5);
        addAdvantage(impact, value);
        addObjectiveAdvantage(impact, clamp(difference * 0.035, -2.5, 2.5));
        impact.userLanePressure.BotLane =
          (impact.userLanePressure.BotLane ?? 0) + Math.max(0, value);
        break;
      }
      case "TopIsland": {
        const difference = topScore(input.userTeam) - topScore(input.enemyTeam);
        const value = clamp(difference * 0.06, -3.6, 3.6);
        addAdvantage(impact, value);
        impact.userLanePressure.TopLane =
          (impact.userLanePressure.TopLane ?? 0) + Math.max(0, value) + 1;
        break;
      }
      case "MidKingdom": {
        const difference = midScore(input.userTeam) - midScore(input.enemyTeam);
        const value = clamp(difference * 0.06, -3.6, 3.6);
        addAdvantage(impact, value);
        addObjectiveAdvantage(impact, clamp(difference * 0.035, -2.5, 2.5));
        impact.userLanePressure.MidLane =
          (impact.userLanePressure.MidLane ?? 0) + Math.max(0, value);
        break;
      }
    }
  });

  impact.userPowerDelta = clamp(impact.userPowerDelta, 0, 8);
  impact.enemyPowerDelta = clamp(impact.enemyPowerDelta, 0, 8);
  impact.userObjectivePower = clamp(impact.userObjectivePower, 0, 6);
  impact.enemyObjectivePower = clamp(impact.enemyObjectivePower, 0, 6);
  impact.fightChanceMultiplier = clamp(
    impact.fightChanceMultiplier,
    0.8,
    1.45,
  );
  impact.varianceMultiplier = clamp(impact.varianceMultiplier, 0.8, 1.35);
  impact.lateGameUserBias = clamp(impact.lateGameUserBias, -4, 4);

  if (input.difficulty === "Hard") {
    impact.userPowerDelta *= 0.92;
    impact.enemyPowerDelta *= 1.04;
  }

  return impact;
}
