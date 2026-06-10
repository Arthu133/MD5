import {
  randomVarianceByStage,
  tournamentDifficultyScaling,
} from "../data/meta/competitiveMeta";
import type {
  CampaignResult,
  CompetitiveEnemyTeam,
  DraftTeam,
  GameDifficulty,
  MatchResult,
  SeriesResult,
  TeamArchetype,
  TeamScore,
  TournamentStage,
} from "../types/game";
import { generateCounterMetaEnemy } from "./competitiveEnemyEngine";
import { generateFinalDiagnosis } from "./diagnosisEngine";
import { simulateLiveMatch } from "./liveMatchEngine";
import { calculateTeamScore } from "./synergyEngine";

const clamp = (value: number, min = 4, max = 96) =>
  Math.max(min, Math.min(max, value));

const groupQualificationBonus: Record<
  GameDifficulty,
  Record<"Wildcard" | "Regional" | "Major", number>
> = {
  Classic: {
    Wildcard: 16,
    Regional: 12,
    Major: 5,
  },
  Hard: {
    Wildcard: 10,
    Regional: 7,
    Major: 1,
  },
};

const knockoutPressure: Record<
  GameDifficulty,
  Record<Exclude<TournamentStage, "Groups">, number>
> = {
  Classic: {
    Quarterfinals: 0,
    Semifinals: 0,
    Final: 0,
  },
  Hard: {
    Quarterfinals: 2,
    Semifinals: 5,
    Final: 9,
  },
};

const liveStageLabels: Record<TournamentStage, string> = {
  Groups: "Fase de Grupos",
  Quarterfinals: "Quartas de Final",
  Semifinals: "Semifinal",
  Final: "Final MD5",
};

export const matchupMatrix: Record<
  TeamArchetype,
  Partial<Record<TeamArchetype, number>>
> = {
  "Team Fight": {
    Pickoff: 7,
    Poke: -5,
    Scaling: 2,
    "Split Push": -4,
    "Early Snowball": 3,
    "Protect the Carry": 1,
    Balanced: 0,
  },
  Pickoff: {
    Scaling: 6,
    "Protect the Carry": 4,
    "Team Fight": -6,
    Poke: 3,
    "Split Push": 1,
    "Early Snowball": -1,
    Balanced: 1,
  },
  "Split Push": {
    "Team Fight": 6,
    Scaling: 2,
    Poke: 1,
    Pickoff: -2,
    "Protect the Carry": 3,
    "Early Snowball": -4,
    Balanced: 1,
  },
  Poke: {
    "Team Fight": 6,
    "Early Snowball": -4,
    Pickoff: -3,
    "Split Push": -1,
    Scaling: 2,
    "Protect the Carry": 3,
    Balanced: 1,
  },
  "Protect the Carry": {
    "Early Snowball": 4,
    "Team Fight": 1,
    Pickoff: -5,
    Poke: -2,
    "Split Push": -3,
    Scaling: 2,
    Balanced: 1,
  },
  "Early Snowball": {
    Scaling: 7,
    Poke: 4,
    "Split Push": 4,
    "Protect the Carry": -2,
    "Team Fight": -3,
    Pickoff: 1,
    Balanced: 0,
  },
  Scaling: {
    "Early Snowball": -7,
    "Team Fight": -2,
    Pickoff: -6,
    Poke: -1,
    "Split Push": -2,
    "Protect the Carry": 1,
    Balanced: 2,
  },
  Balanced: {
    "Team Fight": 0,
    Pickoff: 0,
    "Split Push": 0,
    Poke: 0,
    "Protect the Carry": 0,
    "Early Snowball": 0,
    Scaling: 0,
  },
};

const calculateSeriesConsistencyPenalty = (teamScore: TeamScore) => {
  const metrics = teamScore.metrics;
  let penalty = 0;
  penalty += Math.max(0, 68 - metrics.consistency) * 0.15;
  penalty += Math.max(0, metrics.executionDifficulty - 64) * 0.11;
  penalty += Math.max(0, 62 - metrics.itemization) * 0.16;
  penalty += Math.max(0, 50 - metrics.frontline) * 0.06;
  penalty += Math.max(0, 45 - metrics.engage) * 0.05;
  penalty += Math.max(0, 45 - metrics.peel) * 0.05;
  penalty += Math.max(0, 82 - teamScore.total) * 0.035;
  if (teamScore.archetype === "Early Snowball" && metrics.scaling < 50) penalty += 2.5;
  if (Math.min(metrics.physicalDamage, metrics.magicDamage) < 24) penalty += 3;
  return Math.round(penalty * 10) / 10;
};

const calculatePunishedWeaknessPenalty = (
  teamScore: TeamScore,
  enemy: CompetitiveEnemyTeam,
  difficulty: GameDifficulty,
) => {
  const metrics = teamScore.metrics;
  const punish = enemy.punishProfile;
  let penalty = 0;
  if (punish.punishesNoFrontline) penalty += Math.max(0, 45 - metrics.frontline) * 0.11;
  if (punish.punishesLowPeel) penalty += Math.max(0, 48 - metrics.peel) * 0.1;
  if (punish.punishesFullAD || punish.punishesFullAP) penalty += 4.5;
  if (punish.punishesBadItems) penalty += Math.max(0, 70 - metrics.itemization) * 0.12;
  if (punish.punishesLowWaveClear) penalty += Math.max(0, 48 - metrics.waveClear) * 0.08;
  if (punish.punishesNoEngage) penalty += Math.max(0, 45 - metrics.engage) * 0.08;
  if (punish.punishesLowScaling) penalty += Math.max(0, 52 - metrics.scaling) * 0.07;
  return (
    penalty *
    tournamentDifficultyScaling[difficulty].badCompPenaltyMultiplier
  );
};

const explainGame = (
  win: boolean,
  teamScore: TeamScore,
  enemy: CompetitiveEnemyTeam,
) => {
  const metrics = teamScore.metrics;
  if (win && metrics.itemization >= 78 && metrics.frontline >= 50) {
    return "Mesmo contra uma composição meta, sua itemização e frontline sustentaram a condição de vitória.";
  }
  if (win && metrics.consistency >= 75) {
    return "Seu draft se adaptou melhor ao longo da série e executou o plano com consistência.";
  }
  if (!win && enemy.punishProfile.punishesLowPeel) {
    return `${enemy.name} montou uma composição de ${enemy.archetype} e puniu a falta de peel no Carry.`;
  }
  if (!win && enemy.punishProfile.punishesFullAD) {
    return "Seu dano físico previsível encontrou uma frontline preparada para séries longas.";
  }
  if (!win && enemy.punishProfile.punishesFullAP) {
    return "O excesso de dano mágico foi neutralizado pela adaptação defensiva adversária.";
  }
  if (!win && enemy.punishProfile.punishesNoEngage) {
    return `${enemy.name} controlou objetivos antes das lutas porque seu time tinha pouco engage.`;
  }
  if (!win && enemy.punishProfile.punishesBadItems) {
    return "A itemização incoerente reduziu sua consistência conforme a série avançou.";
  }
  if (!win && metrics.roleFit < 72) {
    return "Escolhas fora de rota reduziram pressão, objetivos e clareza da composição.";
  }
  return win
    ? `Sua condição de vitória superou o plano de ${enemy.winCondition}.`
    : `${enemy.name} venceu pela força em ${enemy.mainThreat}.`;
};

const simulateCompetitiveGame = (
  teamScore: TeamScore,
  enemy: CompetitiveEnemyTeam,
  difficulty: GameDifficulty,
  stage: TournamentStage,
  gameNumber: number,
  matchNumber: number,
  seriesConsistencyPenalty: number,
  currentUserWins: number,
  currentEnemyWins: number,
): MatchResult => {
  const metrics = teamScore.metrics;
  const matchupAdvantage =
    matchupMatrix[teamScore.archetype][enemy.archetype] ?? 0;
  const userQuality =
    teamScore.total * 0.56 +
    metrics.itemization * 0.13 +
    metrics.consistency * 0.1 +
    metrics.roleFit * 0.08 +
    Math.max(metrics.engage, metrics.peel, metrics.objectiveControl) * 0.07 +
    Math.min(metrics.physicalDamage, metrics.magicDamage) * 0.06;
  const enemyQuality =
    enemy.difficulty * 0.43 +
    enemy.metaRating * 0.17 +
    enemy.draftCoherence * 0.2 +
    enemy.itemizationQuality * 0.15 +
    enemy.modifiers.objectiveControl * 0.5;
  const weaknessPenalty = calculatePunishedWeaknessPenalty(
    teamScore,
    enemy,
    difficulty,
  );
  const itemPenalty =
    Math.max(0, 68 - metrics.itemization) *
    0.09 *
    tournamentDifficultyScaling[difficulty].badItemPenaltyMultiplier;
  const adaptationPenalty =
    stage === "Groups"
      ? 0
      : Math.max(0, gameNumber - 1) *
        (enemy.tier === "Champion" ? 1.3 : enemy.tier === "Elite" ? 0.9 : 0.55);
  const variance = randomVarianceByStage[difficulty][stage];
  const randomness = (Math.random() * 2 - 1) * variance;
  const groupBonus =
    stage === "Groups" &&
    (enemy.tier === "Wildcard" ||
      enemy.tier === "Regional" ||
      enemy.tier === "Major")
      ? groupQualificationBonus[difficulty][enemy.tier]
      : 0;
  const stagePressure =
    stage === "Groups" ? 0 : knockoutPressure[difficulty][stage];
  const chance = clamp(
    50 +
      (userQuality - enemyQuality) * 1.15 +
      matchupAdvantage -
      weaknessPenalty -
      itemPenalty -
      (stage === "Groups" ? seriesConsistencyPenalty * 0.35 : seriesConsistencyPenalty) -
      adaptationPenalty +
      groupBonus -
      stagePressure +
      randomness,
  );
  const win = Math.random() * 100 < chance;

  const baseResult = {
    matchNumber,
    gameNumber,
    stage,
    enemyName: enemy.name,
    enemyArchetype: enemy.archetype,
    enemyTier: enemy.tier,
    userPower: Math.round(chance),
    enemyPower: enemy.difficulty,
    win,
    reason: explainGame(win, teamScore, enemy),
  };
  const context = {
    stage,
    gameNumber,
    matchNumber,
    gameLabel: `${liveStageLabels[stage]} · Jogo ${gameNumber}`,
    difficulty,
    expectedWinner: win ? "User" as const : "Enemy" as const,
    userPower: Math.round(chance),
    seriesUserWins: currentUserWins + (win ? 1 : 0),
    seriesEnemyWins: currentEnemyWins + (win ? 0 : 1),
  };

  return {
    ...baseResult,
    liveSimulation: simulateLiveMatch(teamScore, enemy, context),
  };
};

const simulateSeries = (
  teamScore: TeamScore,
  enemy: CompetitiveEnemyTeam,
  difficulty: GameDifficulty,
  stage: TournamentStage,
  firstMatchNumber: number,
  bestOfFive: boolean,
): SeriesResult => {
  const winsNeeded = bestOfFive ? 3 : 1;
  const seriesConsistencyPenalty = bestOfFive
    ? calculateSeriesConsistencyPenalty(teamScore)
    : 0;
  const games: MatchResult[] = [];
  let userWins = 0;
  let enemyWins = 0;
  let gameNumber = 1;

  while (userWins < winsNeeded && enemyWins < winsNeeded) {
    const game = simulateCompetitiveGame(
      teamScore,
      enemy,
      difficulty,
      stage,
      gameNumber,
      firstMatchNumber + games.length,
      seriesConsistencyPenalty,
      userWins,
      enemyWins,
    );
    games.push(game);
    if (game.win) userWins += 1;
    else enemyWins += 1;
    gameNumber += 1;
  }

  return {
    stage,
    enemy,
    userWins,
    enemyWins,
    won: userWins > enemyWins,
    games,
    seriesConsistencyPenalty,
  };
};

export function simulateCampaign(
  team: DraftTeam,
  difficulty: GameDifficulty = "Classic",
): CampaignResult {
  const teamScore = calculateTeamScore(team, difficulty);
  const series: SeriesResult[] = [];
  const usedOrganizations: string[] = [];
  let matchNumber = 1;

  const groupStrengths = ["weak", "medium", "strong"] as const;
  for (const strength of groupStrengths) {
    const enemy = generateCounterMetaEnemy(
      teamScore,
      "Groups",
      difficulty,
      usedOrganizations,
      strength,
    );
    usedOrganizations.push(enemy.id);
    const groupGame = simulateSeries(
      teamScore,
      enemy,
      difficulty,
      "Groups",
      matchNumber,
      false,
    );
    series.push(groupGame);
    matchNumber += groupGame.games.length;
  }

  const groupWins = series.filter(
    (entry) => entry.stage === "Groups" && entry.won,
  ).length;
  const groupLosses = 3 - groupWins;
  let eliminatedAt: TournamentStage | undefined =
    groupWins >= 2 ? undefined : "Groups";

  const knockoutStages: TournamentStage[] = [
    "Quarterfinals",
    "Semifinals",
    "Final",
  ];

  for (const stage of knockoutStages) {
    if (eliminatedAt) break;
    const enemy = generateCounterMetaEnemy(
      teamScore,
      stage,
      difficulty,
      usedOrganizations,
    );
    usedOrganizations.push(enemy.id);
    const knockoutSeries = simulateSeries(
      teamScore,
      enemy,
      difficulty,
      stage,
      matchNumber,
      true,
    );
    series.push(knockoutSeries);
    matchNumber += knockoutSeries.games.length;
    if (!knockoutSeries.won) eliminatedAt = stage;
  }

  const matches = series.flatMap((entry) => entry.games);
  const wins = matches.filter((match) => match.win).length;
  const losses = matches.length - wins;
  const champion =
    series.some((entry) => entry.stage === "Final") &&
    series.find((entry) => entry.stage === "Final")?.won === true;
  const result: CampaignResult = {
    difficulty,
    wins,
    losses,
    perfectRun: champion && losses === 0,
    champion,
    eliminatedAt,
    groupWins,
    groupLosses,
    teamScore,
    matches,
    series,
    finalDiagnosis: "",
  };
  result.finalDiagnosis = generateFinalDiagnosis(result);
  return result;
}
