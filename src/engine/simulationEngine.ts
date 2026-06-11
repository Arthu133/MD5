import {
  randomVarianceByStage,
  tournamentDifficultyScaling,
} from "../data/meta/competitiveMeta";
import type {
  ActiveRogueCard,
  CampaignResult,
  CompetitiveEnemyTeam,
  DraftTeam,
  GameDifficulty,
  MatchResult,
  RogueCard,
  SeriesResult,
  TeamArchetype,
  TeamScore,
  TournamentStage,
} from "../types/game";
import { generateCounterMetaEnemy } from "./competitiveEnemyEngine";
import { generateFinalDiagnosis } from "./diagnosisEngine";
import { simulateLiveMatch } from "./liveMatchEngine";
import {
  addRogueCardToCampaign,
  applyRogueCardsToChampionStats,
  applyRogueCardsToEnemy,
  applyRogueCardsToLiveMatch,
  applyRogueCardsToMatchContext,
  applyRogueCardsToTeamScore,
  getRandomRogueCardOptions,
  getRogueCardSummaryForMatch,
} from "./rogueCardEngine";
import { calculateTeamScore } from "./synergyEngine";
import {
  analyzeTeamIdentity,
  calculateIdentityMatchupAdvantage,
} from "./teamIdentityEngine";

const clamp = (value: number, min = 4, max = 96) =>
  Math.max(min, Math.min(max, value));

const groupQualificationBonus: Record<
  GameDifficulty,
  Record<"Wildcard" | "Regional" | "Major", number>
> = {
  Classic: { Wildcard: 16, Regional: 12, Major: 5 },
  Hard: { Wildcard: 10, Regional: 7, Major: 1 },
};

const knockoutPressure: Record<
  GameDifficulty,
  Record<Exclude<TournamentStage, "Groups">, number>
> = {
  Classic: { Quarterfinals: 0, Semifinals: 0, Final: 0 },
  Hard: { Quarterfinals: 2, Semifinals: 5, Final: 9 },
};

const liveStageLabels: Record<TournamentStage, string> = {
  Groups: "Fase de Grupos",
  Quarterfinals: "Quartas de Final",
  Semifinals: "Semifinal",
  Final: "Final MD5",
};

const knockoutOrder: TournamentStage[] = [
  "Quarterfinals",
  "Semifinals",
  "Final",
];

export const matchupMatrix: Record<
  TeamArchetype,
  Partial<Record<TeamArchetype, number>>
> = {
  "Team Fight": { Pickoff: 7, Poke: -5, Scaling: 2, "Split Push": -4, "Early Snowball": 3, "Protect the Carry": 1, Balanced: 0 },
  Pickoff: { Scaling: 6, "Protect the Carry": 4, "Team Fight": -6, Poke: 3, "Split Push": 1, "Early Snowball": -1, Balanced: 1 },
  "Split Push": { "Team Fight": 6, Scaling: 2, Poke: 1, Pickoff: -2, "Protect the Carry": 3, "Early Snowball": -4, Balanced: 1 },
  Poke: { "Team Fight": 6, "Early Snowball": -4, Pickoff: -3, "Split Push": -1, Scaling: 2, "Protect the Carry": 3, Balanced: 1 },
  "Protect the Carry": { "Early Snowball": 4, "Team Fight": 1, Pickoff: -5, Poke: -2, "Split Push": -3, Scaling: 2, Balanced: 1 },
  "Early Snowball": { Scaling: 7, Poke: 4, "Split Push": 4, "Protect the Carry": -2, "Team Fight": -3, Pickoff: 1, Balanced: 0 },
  Scaling: { "Early Snowball": -7, "Team Fight": -2, Pickoff: -6, Poke: -1, "Split Push": -2, "Protect the Carry": 1, Balanced: 2 },
  Balanced: { "Team Fight": 0, Pickoff: 0, "Split Push": 0, Poke: 0, "Protect the Carry": 0, "Early Snowball": 0, Scaling: 0 },
};

export type RogueCampaignState = {
  team: DraftTeam;
  difficulty: GameDifficulty;
  baseTeamScore: TeamScore;
  teamScore: TeamScore;
  activeCards: ActiveRogueCard[];
  series: SeriesResult[];
  usedOrganizations: string[];
  currentEnemy: CompetitiveEnemyTeam;
  currentStage: TournamentStage;
  currentGames: MatchResult[];
  currentUserWins: number;
  currentEnemyWins: number;
  groupIndex: number;
  matchNumber: number;
  finished: boolean;
  eliminatedAt?: TournamentStage;
  champion: boolean;
};

export type PreparedRogueMatch = {
  match: MatchResult;
  activeCards: ActiveRogueCard[];
  teamScore: TeamScore;
  enemy: CompetitiveEnemyTeam;
};

const groupStrengths = ["weak", "medium", "strong"] as const;

const generateEnemyForState = (
  teamScore: TeamScore,
  stage: TournamentStage,
  difficulty: GameDifficulty,
  usedOrganizations: string[],
  groupIndex = 0,
) =>
  generateCounterMetaEnemy(
    teamScore,
    stage,
    difficulty,
    usedOrganizations,
    stage === "Groups" ? groupStrengths[groupIndex] : undefined,
  );

export function createRogueCampaignState(
  team: DraftTeam,
  difficulty: GameDifficulty = "Classic",
): RogueCampaignState {
  const baseTeamScore = calculateTeamScore(team, difficulty);
  const currentEnemy = generateEnemyForState(
    baseTeamScore,
    "Groups",
    difficulty,
    [],
  );
  return {
    team,
    difficulty,
    baseTeamScore,
    teamScore: baseTeamScore,
    activeCards: [],
    series: [],
    usedOrganizations: [currentEnemy.id],
    currentEnemy,
    currentStage: "Groups",
    currentGames: [],
    currentUserWins: 0,
    currentEnemyWins: 0,
    groupIndex: 0,
    matchNumber: 1,
    finished: false,
    champion: false,
  };
}

const calculateSeriesConsistencyPenalty = (
  teamScore: TeamScore,
  activeCards: ActiveRogueCard[],
) => {
  const metrics = teamScore.metrics;
  const modifiers = applyRogueCardsToLiveMatch(activeCards);
  let penalty = 0;
  penalty += Math.max(0, 68 - metrics.consistency) * 0.15;
  penalty += Math.max(0, metrics.executionDifficulty - 64) * 0.11;
  penalty += Math.max(0, 58 - metrics.rulesAdaptation) * 0.11;
  penalty += Math.max(0, 50 - metrics.frontline) * 0.06;
  penalty += Math.max(0, 45 - metrics.engage) * 0.05;
  penalty += Math.max(0, 45 - metrics.peel) * 0.05;
  penalty += Math.max(0, 82 - teamScore.total) * 0.035;
  penalty -= modifiers.mentalReset * 0.3;
  if (teamScore.archetype === "Early Snowball" && metrics.scaling < 50) penalty += 2.5;
  if (Math.min(metrics.physicalDamage, metrics.magicDamage) < 24) penalty += 3;
  return Math.max(0, Math.round(penalty * 10) / 10);
};

const punishedWeaknessPenalty = (
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
  if (punish.punishesLowWaveClear) penalty += Math.max(0, 48 - metrics.waveClear) * 0.08;
  if (punish.punishesNoEngage) penalty += Math.max(0, 45 - metrics.engage) * 0.08;
  if (punish.punishesLowScaling) penalty += Math.max(0, 52 - metrics.scaling) * 0.07;
  return penalty * tournamentDifficultyScaling[difficulty].badCompPenaltyMultiplier;
};

const explainGame = (
  win: boolean,
  teamScore: TeamScore,
  enemy: CompetitiveEnemyTeam,
) => {
  const metrics = teamScore.metrics;
  if (win && metrics.cardSynergy >= 78 && metrics.frontline >= 50) {
    return "As regras acumuladas e a frontline sustentaram sua condição de vitória.";
  }
  if (win && metrics.consistency >= 75) {
    return "Seu draft se adaptou melhor e executou o plano com consistência.";
  }
  if (!win && enemy.punishProfile.punishesLowPeel) {
    return `${enemy.name} puniu a falta de peel no Carry com uma composição de ${enemy.archetype}.`;
  }
  if (!win && enemy.punishProfile.punishesFullAD) {
    return "Seu dano físico previsível encontrou uma defesa preparada.";
  }
  if (!win && enemy.punishProfile.punishesFullAP) {
    return "O excesso de dano mágico foi neutralizado pela adaptação adversária.";
  }
  if (!win && enemy.punishProfile.punishesNoEngage) {
    return `${enemy.name} controlou objetivos porque seu time tinha pouco engage.`;
  }
  if (!win && metrics.roleFit < 72) {
    return "Escolhas fora de rota reduziram pressão, objetivos e clareza.";
  }
  return win
    ? `Sua condição de vitória superou o plano de ${enemy.winCondition}.`
    : `${enemy.name} venceu pela força em ${enemy.mainThreat}.`;
};

export function simulateCompetitiveGame(
  userTeam: DraftTeam,
  teamScore: TeamScore,
  enemy: CompetitiveEnemyTeam,
  difficulty: GameDifficulty,
  stage: TournamentStage,
  gameNumber: number,
  matchNumber: number,
  activeCards: ActiveRogueCard[],
  currentUserWins: number,
  currentEnemyWins: number,
): MatchResult {
  const metrics = teamScore.metrics;
  const modifiers = applyRogueCardsToLiveMatch(activeCards);
  const seriesPenalty =
    stage === "Groups"
      ? 0
      : calculateSeriesConsistencyPenalty(teamScore, activeCards);
  const matchupAdvantage =
    matchupMatrix[teamScore.archetype][enemy.archetype] ?? 0;
  const identityAdvantage = calculateIdentityMatchupAdvantage(
    teamScore.identity,
    analyzeTeamIdentity(enemy.simulatedDraft),
  );
  const userQuality =
    teamScore.total * 0.56 +
    metrics.cardSynergy * 0.11 +
    metrics.rulesAdaptation * 0.09 +
    metrics.consistency * 0.08 +
    metrics.roleFit * 0.07 +
    Math.max(metrics.engage, metrics.peel, metrics.objectiveControl) * 0.06 +
    Math.min(metrics.physicalDamage, metrics.magicDamage) * 0.03;
  const enemyQuality =
    enemy.difficulty * 0.43 +
    enemy.metaRating * 0.17 +
    enemy.draftCoherence * 0.2 +
    enemy.rulesAdaptation * 0.15 +
    enemy.modifiers.objectiveControl * 0.5;
  const adaptationPenalty =
    stage === "Groups"
      ? 0
      : Math.max(0, gameNumber - 1) *
        (enemy.tier === "Champion" ? 1.3 : enemy.tier === "Elite" ? 0.9 : 0.55);
  const variance =
    randomVarianceByStage[difficulty][stage] * modifiers.varianceMultiplier;
  const randomness = (Math.random() * 2 - 1) * variance;
  const groupBonus =
    stage === "Groups" &&
    ["Wildcard", "Regional", "Major"].includes(enemy.tier)
      ? groupQualificationBonus[difficulty][
          enemy.tier as "Wildcard" | "Regional" | "Major"
        ]
      : 0;
  const stagePressure =
    stage === "Groups" ? 0 : knockoutPressure[difficulty][stage];
  const momentumBonus =
    currentUserWins > currentEnemyWins
      ? modifiers.momentum * (currentUserWins - currentEnemyWins)
      : -modifiers.momentum * 0.4 * (currentEnemyWins - currentUserWins);
  const chance = clamp(
    50 +
      (userQuality - enemyQuality) * 1.15 +
      matchupAdvantage +
      identityAdvantage -
      punishedWeaknessPenalty(teamScore, enemy, difficulty) -
      seriesPenalty -
      adaptationPenalty +
      groupBonus -
      stagePressure +
      momentumBonus +
      randomness,
  );
  const win = Math.random() * 100 < chance;
  const context = {
    stage,
    gameNumber,
    matchNumber,
    gameLabel: `${liveStageLabels[stage]} · Jogo ${gameNumber}`,
    difficulty,
    expectedWinner: win ? ("User" as const) : ("Enemy" as const),
    userPower: Math.round(chance),
    seriesUserWins: currentUserWins + (win ? 1 : 0),
    seriesEnemyWins: currentEnemyWins + (win ? 0 : 1),
    activeCards,
    rogueModifiers: modifiers,
  };
  const matchContext = applyRogueCardsToMatchContext(
    userTeam,
    enemy.simulatedDraft,
    activeCards,
    context,
  );
  return {
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
    activeCards,
    liveSimulation: simulateLiveMatch(teamScore, enemy, matchContext),
  };
}

export function prepareRogueCampaignMatch(
  state: RogueCampaignState,
  selectedCard?: RogueCard,
): PreparedRogueMatch {
  const activeCards = selectedCard
    ? addRogueCardToCampaign(
        state.activeCards,
        selectedCard,
        {
          matchId: `${state.currentStage}-${state.matchNumber}`,
          stage: state.currentStage,
          userTeam: state.team,
          enemyTeam: state.currentEnemy.simulatedDraft,
          enemyName: state.currentEnemy.name,
          enemyArchetype: state.currentEnemy.archetype,
          activeCards: state.activeCards,
          difficulty: state.difficulty,
        },
      )
    : state.activeCards;
  const enhancedTeam = applyRogueCardsToChampionStats(
    state.team,
    activeCards,
    state.currentStage,
  );
  const recalculated = calculateTeamScore(enhancedTeam, state.difficulty);
  const teamScore = applyRogueCardsToTeamScore(
    recalculated,
    activeCards,
    state.currentStage,
  );
  const enemy = applyRogueCardsToEnemy(state.currentEnemy, activeCards);
  const match = simulateCompetitiveGame(
    state.team,
    teamScore,
    enemy,
    state.difficulty,
    state.currentStage,
    state.currentGames.length + 1,
    state.matchNumber,
    activeCards,
    state.currentUserWins,
    state.currentEnemyWins,
  );
  return { match, activeCards, teamScore, enemy };
}

const completeSeries = (
  state: RogueCampaignState,
  games: MatchResult[],
  enemy: CompetitiveEnemyTeam,
  userWins: number,
  enemyWins: number,
): SeriesResult => ({
  stage: state.currentStage,
  enemy,
  userWins,
  enemyWins,
  won: userWins > enemyWins,
  games,
  seriesConsistencyPenalty:
    state.currentStage === "Groups"
      ? 0
      : calculateSeriesConsistencyPenalty(state.teamScore, state.activeCards),
});

export function advanceRogueCampaignState(
  state: RogueCampaignState,
  prepared: PreparedRogueMatch,
): RogueCampaignState {
  const currentGames = [...state.currentGames, prepared.match];
  const currentUserWins = state.currentUserWins + (prepared.match.win ? 1 : 0);
  const currentEnemyWins = state.currentEnemyWins + (prepared.match.win ? 0 : 1);
  const base = {
    ...state,
    activeCards: prepared.activeCards,
    teamScore: prepared.teamScore,
    currentEnemy: state.currentEnemy,
    currentGames,
    currentUserWins,
    currentEnemyWins,
    matchNumber: state.matchNumber + 1,
  };

  if (state.currentStage === "Groups") {
    const completed = completeSeries(
      state,
      currentGames,
      prepared.enemy,
      currentUserWins,
      currentEnemyWins,
    );
    const series = [...state.series, completed];
    const nextGroupIndex = state.groupIndex + 1;
    if (nextGroupIndex < 3) {
      const nextEnemy = generateEnemyForState(
        prepared.teamScore,
        "Groups",
        state.difficulty,
        state.usedOrganizations,
        nextGroupIndex,
      );
      return {
        ...base,
        series,
        groupIndex: nextGroupIndex,
        usedOrganizations: [...state.usedOrganizations, nextEnemy.id],
        currentEnemy: nextEnemy,
        currentGames: [],
        currentUserWins: 0,
        currentEnemyWins: 0,
      };
    }
    const groupWins = series.filter(
      (entry) => entry.stage === "Groups" && entry.won,
    ).length;
    if (groupWins < 2) {
      return {
        ...base,
        series,
        groupIndex: nextGroupIndex,
        finished: true,
        eliminatedAt: "Groups",
      };
    }
    const nextEnemy = generateEnemyForState(
      prepared.teamScore,
      "Quarterfinals",
      state.difficulty,
      state.usedOrganizations,
    );
    return {
      ...base,
      series,
      groupIndex: nextGroupIndex,
      currentStage: "Quarterfinals",
      usedOrganizations: [...state.usedOrganizations, nextEnemy.id],
      currentEnemy: nextEnemy,
      currentGames: [],
      currentUserWins: 0,
      currentEnemyWins: 0,
    };
  }

  if (currentUserWins < 3 && currentEnemyWins < 3) return base;

  const completed = completeSeries(
    state,
    currentGames,
    prepared.enemy,
    currentUserWins,
    currentEnemyWins,
  );
  const series = [...state.series, completed];
  if (currentEnemyWins >= 3) {
    return {
      ...base,
      series,
      finished: true,
      eliminatedAt: state.currentStage,
    };
  }
  if (state.currentStage === "Final") {
    return { ...base, series, finished: true, champion: true };
  }

  const nextStage =
    knockoutOrder[knockoutOrder.indexOf(state.currentStage) + 1];
  const nextEnemy = generateEnemyForState(
    prepared.teamScore,
    nextStage,
    state.difficulty,
    state.usedOrganizations,
  );
  return {
    ...base,
    series,
    currentStage: nextStage,
    usedOrganizations: [...state.usedOrganizations, nextEnemy.id],
    currentEnemy: nextEnemy,
    currentGames: [],
    currentUserWins: 0,
    currentEnemyWins: 0,
  };
}

export function getCampaignResult(
  state: RogueCampaignState,
): CampaignResult {
  const matches = state.series.flatMap((entry) => entry.games);
  const wins = matches.filter((match) => match.win).length;
  const groupWins = state.series.filter(
    (entry) => entry.stage === "Groups" && entry.won,
  ).length;
  const result: CampaignResult = {
    difficulty: state.difficulty,
    wins,
    losses: matches.length - wins,
    perfectRun: state.champion && matches.every((match) => match.win),
    champion: state.champion,
    eliminatedAt: state.eliminatedAt,
    groupWins,
    groupLosses: 3 - groupWins,
    teamScore: state.teamScore,
    matches,
    series: state.series,
    finalDiagnosis: "",
    activeCards: state.activeCards,
  };
  result.finalDiagnosis = generateFinalDiagnosis(result);
  return result;
}

export function simulateCampaign(
  team: DraftTeam,
  difficulty: GameDifficulty = "Classic",
): CampaignResult {
  let state = createRogueCampaignState(team, difficulty);
  let guard = 0;
  while (!state.finished && guard < 30) {
    const needsCard =
      state.currentStage === "Groups" || state.currentGames.length === 0;
    const card = needsCard
      ? getRandomRogueCardOptions(state.activeCards, 1)[0]
      : undefined;
    if (needsCard && !card) break;
    const prepared = prepareRogueCampaignMatch(state, card);
    state = advanceRogueCampaignState(state, prepared);
    guard += 1;
  }
  return getCampaignResult(state);
}

export const summarizePreparedMatchCards = (
  prepared: PreparedRogueMatch,
) => getRogueCardSummaryForMatch(prepared.activeCards);
