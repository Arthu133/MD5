import { rogueCards } from "../data/rogueCards";
import type {
  ActiveRogueCard,
  CardPickContext,
  ChampionBuild,
  CompetitiveEnemyTeam,
  DraftTeam,
  MatchContext,
  RogueCard,
  RogueCardCondition,
  RogueCardEffect,
  RogueCardEffectTarget,
  RogueCardOfferContext,
  RogueRuleModifiers,
  TeamMetrics,
  TeamScore,
  TournamentStage,
} from "../types/game";
import { calculateRoleFit } from "./roleEngine";
import { calculateTeamScore } from "./synergyEngine";
import { applyChampionAttributeDelta } from "./championAttributeEngine";

const clamp = (value: number, min = 0, max = 100) =>
  Math.round(Math.max(min, Math.min(max, value)));

export const defaultRogueModifiers: RogueRuleModifiers = {
  durationMinutes: 0,
  varianceMultiplier: 1,
  teamScoreWeight: 1,
  fightChanceMultiplier: 1,
  killGoldMultiplier: 1,
  objectiveValueMultiplier: 1,
  dragonValueMultiplier: 1,
  baronPressureMultiplier: 1,
  towerChanceMultiplier: 1,
  towerResistance: 0,
  inhibitorResistance: 0,
  nexusResistance: 0,
  objectiveStealChance: 0,
  comebackMultiplier: 1,
  snowballMultiplier: 1,
  earlyObjectiveOffset: 0,
  enemyDraftQuality: 0,
  roleFitModifier: 0,
  offMetaModifier: 0,
  scoreCapModifier: 0,
  mentalReset: 0,
  momentum: 0,
};

const shuffle = <T,>(values: T[]) =>
  [...values].sort(() => Math.random() - 0.5);

const rarityWeight: Record<RogueCard["rarity"], number> = {
  Common: 46,
  Rare: 32,
  Epic: 17,
  Legendary: 5,
};

const offerWeight = (
  card: RogueCard,
  context?: RogueCardOfferContext,
) => {
  let weight = rarityWeight[card.rarity];
  if (card.mechanic === "LastChance") {
    if (context?.stage === "Groups") return 0;
    if (
      context &&
      context.seriesEnemyWins > context.seriesUserWins
    ) {
      weight *= 2.4;
    }
  }
  return weight;
};

const weightedPick = (
  pool: RogueCard[],
  context?: RogueCardOfferContext,
) => {
  const total = pool.reduce(
    (sum, entry) => sum + offerWeight(entry, context),
    0,
  );
  let cursor = Math.random() * total;
  for (const entry of pool) {
    cursor -= offerWeight(entry, context);
    if (cursor <= 0) return entry;
  }
  return pool[pool.length - 1];
};

export function getRandomRogueCardOptions(
  activeCards: ActiveRogueCard[] = [],
  count = 3,
  excludedIds: string[] = [],
  context?: RogueCardOfferContext,
): RogueCard[] {
  const unavailable = new Set([
    ...activeCards.map((entry) => entry.card.id),
    ...excludedIds,
  ]);
  const pool = rogueCards.filter(
    (entry) =>
      !unavailable.has(entry.id) && offerWeight(entry, context) > 0,
  );
  const selected: RogueCard[] = [];

  while (pool.length && selected.length < count) {
    const picked = weightedPick(pool, context);
    selected.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }
  return shuffle(selected);
}

export function refreshRogueCardOptions(
  activeCards: ActiveRogueCard[],
  previousOptions: RogueCard[],
  count = 3,
  context?: RogueCardOfferContext,
) {
  return getRandomRogueCardOptions(
    activeCards,
    count,
    previousOptions.map((entry) => entry.id),
    context,
  );
}

export function addRogueCardToCampaign(
  activeCards: ActiveRogueCard[],
  card: RogueCard,
  context: CardPickContext,
): ActiveRogueCard[] {
  if (activeCards.some((entry) => entry.card.id === card.id)) return activeCards;
  return [
    ...activeCards,
    {
      card,
      pickedBeforeMatchId: context.matchId,
      pickedAtStage: context.stage,
    },
  ];
}

const applyOperation = (
  current: number,
  effect: RogueCardEffect,
  intensity: number,
) => {
  const value = effect.value * intensity;
  if (effect.operation === "multiply") {
    return current * (1 + (effect.value - 1) * intensity);
  }
  if (effect.operation === "reduce") return current - value;
  if (effect.operation === "cap") return Math.min(current, value);
  return current + value;
};

const hasFullAD = (metrics?: TeamMetrics) =>
  Boolean(metrics && metrics.physicalDamage - metrics.magicDamage >= 30);

const hasFullAP = (metrics?: TeamMetrics) =>
  Boolean(metrics && metrics.magicDamage - metrics.physicalDamage >= 30);

const matchesCondition = (
  condition: RogueCardCondition | undefined,
  build?: ChampionBuild,
  metrics?: TeamMetrics,
  stage?: TournamentStage,
) => {
  if (!condition) return true;
  if (condition.roles && (!build || !condition.roles.includes(build.role))) return false;
  if (
    condition.classes &&
    (!build ||
      !condition.classes.some((championClass) =>
        build.champion.classes.includes(championClass),
      ))
  ) return false;
  if (
    condition.damageProfiles &&
    (!build || !condition.damageProfiles.includes(build.champion.damageProfile))
  ) return false;
  if (condition.stages && (!stage || !condition.stages.includes(stage))) return false;
  if (condition.hasFullAD && !hasFullAD(metrics)) return false;
  if (condition.hasFullAP && !hasFullAP(metrics)) return false;
  if (
    condition.isOffRole &&
    (!build || calculateRoleFit(build.champion, build.role, "Hard").score >= 85)
  ) return false;
  return true;
};

const cardAppliesTo = (
  card: RogueCard,
  target: RogueCardEffectTarget,
) =>
  card.target.includes("BothTeams") ||
  card.target.includes(target);

export function getRogueRuleModifiers(
  activeCards: ActiveRogueCard[],
): RogueRuleModifiers {
  const modifiers = { ...defaultRogueModifiers };
  activeCards.forEach(({ card }) => {
    card.effects.forEach((entry) => {
      if (!entry.rule || entry.condition) return;
      modifiers[entry.rule] = applyOperation(
        modifiers[entry.rule],
        entry,
        1,
      );
    });
  });
  return modifiers;
}

export function applyRogueCardsToChampionStats(
  team: DraftTeam,
  activeCards: ActiveRogueCard[],
  stage?: TournamentStage,
  target: RogueCardEffectTarget = "BothTeams",
): DraftTeam {
  return team.map((build) => {
    let champion = {
      ...build.champion,
      stats: { ...build.champion.stats },
      attributes: build.champion.attributes.map((attribute) => ({
        ...attribute,
      })),
    };
    activeCards.forEach(({ card }) => {
      if (!cardAppliesTo(card, target)) return;
      card.effects.forEach((entry) => {
        if (!matchesCondition(entry.condition, build, undefined, stage)) return;
        if (entry.attribute) {
          champion = applyChampionAttributeDelta(
            champion,
            entry.attribute,
            entry.value,
          );
        }
        if (entry.stat) {
          champion.stats[entry.stat] = clamp(
            applyOperation(champion.stats[entry.stat], entry, 1),
          );
        }
      });
    });
    return {
      ...build,
      champion,
    };
  });
}

export function applyRogueCardsToTeamScore(
  baseScore: TeamScore,
  activeCards: ActiveRogueCard[],
  stage?: TournamentStage,
  target: RogueCardEffectTarget = "BothTeams",
): TeamScore {
  const metrics = { ...baseScore.metrics };
  const applicableCards = activeCards.filter(({ card }) =>
    cardAppliesTo(card, target),
  );
  applicableCards.forEach(({ card }) => {
    card.effects.forEach((entry) => {
      if (
        !entry.metric ||
        !matchesCondition(entry.condition, undefined, metrics, stage)
      ) return;
      metrics[entry.metric] = clamp(
        applyOperation(metrics[entry.metric], entry, 1),
      );
    });
  });

  const modifiers = getRogueRuleModifiers(activeCards);
  const conditionalScoreCapModifier = applicableCards.reduce((total, { card }) => {
    return (
      total +
      card.effects.reduce((cardTotal, entry) => {
        if (
          entry.rule !== "scoreCapModifier" ||
          !matchesCondition(entry.condition, undefined, metrics, stage)
        ) {
          return cardTotal;
        }
        return cardTotal + entry.value;
      }, 0)
    );
  }, 0);
  metrics.cardSynergy = clamp(
    metrics.cardSynergy +
      applicableCards.length * 1.5 +
      Math.min(
        12,
        new Set(applicableCards.flatMap(({ card }) => card.tags)).size,
      ),
  );
  metrics.rulesAdaptation = clamp(
    metrics.rulesAdaptation +
      Math.min(18, applicableCards.length * 2) +
      modifiers.offMetaModifier * 0.25,
  );
  const metricDelta =
    (metrics.cardSynergy - baseScore.metrics.cardSynergy) * 0.12 +
    (metrics.rulesAdaptation - baseScore.metrics.rulesAdaptation) * 0.1 +
    (metrics.objectiveControl - baseScore.metrics.objectiveControl) * 0.05 +
    (metrics.earlyGame - baseScore.metrics.earlyGame) * 0.04 +
    (metrics.scaling - baseScore.metrics.scaling) * 0.04;
  const rawTotal = clamp(
    (baseScore.rawTotal + metricDelta) * modifiers.teamScoreWeight,
  );
  const cap = clamp(
    (baseScore.scoreCap?.finalCap ?? 100) +
      modifiers.scoreCapModifier +
      conditionalScoreCapModifier,
    35,
    100,
  );

  return {
    ...baseScore,
    metrics,
    rawTotal,
    total: Math.min(rawTotal, cap),
    scoreCap: baseScore.scoreCap
      ? { ...baseScore.scoreCap, finalCap: cap }
      : undefined,
    cardSynergy: metrics.cardSynergy,
    rulesAdaptation: metrics.rulesAdaptation,
  };
}

export function applyRogueCardsToEnemy(
  enemy: CompetitiveEnemyTeam,
  activeCards: ActiveRogueCard[],
): CompetitiveEnemyTeam {
  const modifiers = getRogueRuleModifiers(activeCards);
  const enhancedDraft = applyRogueCardsToChampionStats(
    enemy.simulatedDraft,
    activeCards,
    enemy.stage,
    "EnemyTeam",
  );
  const baseDraftScore = calculateTeamScore(enemy.simulatedDraft, "Classic");
  const enhancedDraftScore = applyRogueCardsToTeamScore(
    calculateTeamScore(enhancedDraft, "Classic"),
    activeCards,
    enemy.stage,
    "EnemyTeam",
  );
  const cardDelta = enhancedDraftScore.total - baseDraftScore.total;
  const rulesAdaptation = clamp(
    enemy.rulesAdaptation +
      modifiers.enemyDraftQuality +
      (enhancedDraftScore.rulesAdaptation - baseDraftScore.rulesAdaptation) *
        0.35,
  );
  return {
    ...enemy,
    difficulty: clamp(
      enemy.difficulty +
        modifiers.enemyDraftQuality * 0.45 +
        cardDelta * 0.35,
      40,
      99,
    ),
    metaRating: clamp(enemy.metaRating + modifiers.enemyDraftQuality * 0.35),
    draftCoherence: clamp(
      enemy.draftCoherence +
        modifiers.enemyDraftQuality * 0.5 +
        cardDelta * 0.25,
    ),
    rulesAdaptation,
  };
}

export function applyRogueCardsToMatchContext(
  userTeam: DraftTeam,
  enemyTeam: DraftTeam,
  activeCards: ActiveRogueCard[],
  context: MatchContext,
): MatchContext {
  return {
    ...context,
    userTeam: applyRogueCardsToChampionStats(
      userTeam,
      activeCards,
      context.stage,
      "UserTeam",
    ),
    enemyTeam: applyRogueCardsToChampionStats(
      enemyTeam,
      activeCards,
      context.stage,
      "EnemyTeam",
    ),
    activeCards,
    rogueModifiers: getRogueRuleModifiers(activeCards),
  };
}

export function applyRogueCardsToLiveMatch(
  activeCards: ActiveRogueCard[],
) {
  return getRogueRuleModifiers(activeCards);
}

export function getRogueCardSummaryForMatch(
  activeCards: ActiveRogueCard[],
): string[] {
  if (!activeCards.length) return ["Nenhuma regra especial ativa."];
  return activeCards.map(({ card }) => `${card.name}: ${card.description}`);
}
