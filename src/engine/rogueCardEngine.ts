import { rogueCards } from "../data/rogueCards";
import type {
  ActiveRogueCard,
  CardPickContext,
  ChampionBuild,
  CompetitiveEnemyTeam,
  DraftTeam,
  GameDifficulty,
  MatchContext,
  RogueCard,
  RogueCardCondition,
  RogueCardEffect,
  RogueRuleModifiers,
  TeamMetrics,
  TeamScore,
  TournamentStage,
} from "../types/game";
import { calculateRoleFit } from "./roleEngine";
import { calculateTeamScore } from "./synergyEngine";

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

const weightedPick = (pool: RogueCard[]) => {
  const total = pool.reduce((sum, entry) => sum + rarityWeight[entry.rarity], 0);
  let cursor = Math.random() * total;
  for (const entry of pool) {
    cursor -= rarityWeight[entry.rarity];
    if (cursor <= 0) return entry;
  }
  return pool[pool.length - 1];
};

export function getRandomRogueCardOptions(
  activeCards: ActiveRogueCard[] = [],
  count = 3,
  excludedIds: string[] = [],
): RogueCard[] {
  const unavailable = new Set([
    ...activeCards.map((entry) => entry.card.id),
    ...excludedIds,
  ]);
  const pool = rogueCards.filter((entry) => !unavailable.has(entry.id));
  const selected: RogueCard[] = [];

  while (pool.length && selected.length < count) {
    const picked = weightedPick(pool);
    selected.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }
  return shuffle(selected);
}

export function refreshRogueCardOptions(
  activeCards: ActiveRogueCard[],
  previousOptions: RogueCard[],
  count = 3,
) {
  return getRandomRogueCardOptions(
    activeCards,
    count,
    previousOptions.map((entry) => entry.id),
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

const effectIntensity = (
  activeCards: ActiveRogueCard[],
  sourceCardId: string,
) =>
  sourceCardId !== "cartas-instaveis" &&
  activeCards.some((entry) => entry.card.id === "cartas-instaveis")
    ? 1.25
    : 1;

export function getRogueRuleModifiers(
  activeCards: ActiveRogueCard[],
): RogueRuleModifiers {
  const modifiers = { ...defaultRogueModifiers };
  activeCards.forEach(({ card }) => {
    const intensity = effectIntensity(activeCards, card.id);
    card.effects.forEach((entry) => {
      if (!entry.rule || entry.condition) return;
      modifiers[entry.rule] = applyOperation(
        modifiers[entry.rule],
        entry,
        intensity,
      );
    });
  });
  return modifiers;
}

export function applyRogueCardsToChampionStats(
  team: DraftTeam,
  activeCards: ActiveRogueCard[],
  stage?: TournamentStage,
): DraftTeam {
  return team.map((build) => {
    const stats = { ...build.champion.stats };
    activeCards.forEach(({ card }) => {
      const intensity = effectIntensity(activeCards, card.id);
      card.effects.forEach((entry) => {
        if (
          !entry.stat ||
          !matchesCondition(entry.condition, build, undefined, stage)
        ) return;
        stats[entry.stat] = clamp(
          applyOperation(stats[entry.stat], entry, intensity),
        );
      });
    });
    return {
      ...build,
      champion: { ...build.champion, stats },
    };
  });
}

export function applyRogueCardsToTeamScore(
  baseScore: TeamScore,
  activeCards: ActiveRogueCard[],
  stage?: TournamentStage,
): TeamScore {
  const metrics = { ...baseScore.metrics };
  activeCards.forEach(({ card }) => {
    const intensity = effectIntensity(activeCards, card.id);
    card.effects.forEach((entry) => {
      if (
        !entry.metric ||
        !matchesCondition(entry.condition, undefined, metrics, stage)
      ) return;
      metrics[entry.metric] = clamp(
        applyOperation(metrics[entry.metric], entry, intensity),
      );
    });
  });

  const modifiers = getRogueRuleModifiers(activeCards);
  const conditionalScoreCapModifier = activeCards.reduce((total, { card }) => {
    const intensity = effectIntensity(activeCards, card.id);
    return (
      total +
      card.effects.reduce((cardTotal, entry) => {
        if (
          entry.rule !== "scoreCapModifier" ||
          !matchesCondition(entry.condition, undefined, metrics, stage)
        ) {
          return cardTotal;
        }
        return cardTotal + entry.value * intensity;
      }, 0)
    );
  }, 0);
  metrics.cardSynergy = clamp(
    metrics.cardSynergy +
      activeCards.length * 1.5 +
      Math.min(12, new Set(activeCards.flatMap(({ card }) => card.tags)).size),
  );
  metrics.rulesAdaptation = clamp(
    metrics.rulesAdaptation +
      Math.min(18, activeCards.length * 2) +
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
  );
  const baseDraftScore = calculateTeamScore(enemy.simulatedDraft, "Classic");
  const enhancedDraftScore = applyRogueCardsToTeamScore(
    calculateTeamScore(enhancedDraft, "Classic"),
    activeCards,
    enemy.stage,
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
    ),
    enemyTeam: applyRogueCardsToChampionStats(
      enemyTeam,
      activeCards,
      context.stage,
    ),
    activeCards,
    rogueModifiers: getRogueRuleModifiers(activeCards),
  };
}

const average = (values: number[]) =>
  values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;

export function getRogueCardMatchupInsight(
  card: RogueCard,
  enemyTeam: DraftTeam,
  enemyArchetype: TeamScore["archetype"],
  difficulty: GameDifficulty,
): string | null {
  if (difficulty === "Hard") return null;
  const enemyScore = calculateTeamScore(enemyTeam, "Classic");
  const tankCount = enemyTeam.filter(
    ({ champion }) =>
      champion.classes.includes("Tank") || champion.stats.tankiness >= 65,
  ).length;
  const sustain = average(
    enemyTeam.map(({ champion }) => champion.stats.sustain),
  );
  const engage = enemyScore.metrics.engage;
  const scaling = enemyScore.metrics.scaling;
  const fullAD =
    enemyScore.metrics.physicalDamage - enemyScore.metrics.magicDamage >= 28;
  const fullAP =
    enemyScore.metrics.magicDamage - enemyScore.metrics.physicalDamage >= 28;

  if (card.id === "anti-tank-meta" && tankCount >= 2) {
    return `Este adversário usa ${tankCount} campeões resistentes, então Anti-Tank Meta tende a reduzir a força da frontline inimiga.`;
  }
  if (card.id === "anti-cura-meta" && sustain >= 52) {
    return "O draft inimigo tem bastante sustain, então Anti-Cura Meta pode enfraquecer suas lutas longas.";
  }
  if (
    ["meta-agressivo", "sem-paciencia", "power-spike-cedo"].includes(card.id) &&
    scaling >= 62
  ) {
    return "O inimigo escala bem, então acelerar a partida pode impedir que ele alcance seu melhor momento.";
  }
  if (
    ["escudos-fortes", "protect-the-carry"].includes(card.id) &&
    engage >= 55
  ) {
    return "O adversário tem engage forte; mais proteção pode preservar seus carregadores na iniciação.";
  }
  if (card.id === "dive-meta" && enemyArchetype === "Poke") {
    return "O adversário joga por poke, então Dive Meta pode ajudar a encurtar a distância e forçar lutas.";
  }
  if (card.id === "full-ad-punido" && fullAD) {
    return "O draft inimigo concentra dano físico, então Full AD Punido tende a afetá-lo com mais força.";
  }
  if (card.id === "full-ap-punido" && fullAP) {
    return "O draft inimigo concentra dano mágico, então Full AP Punido tende a afetá-lo com mais força.";
  }
  if (
    card.tags.includes("objective") &&
    enemyScore.metrics.objectiveControl >= 58
  ) {
    return "O inimigo disputa objetivos muito bem; esta carta deve tornar essas janelas ainda mais decisivas.";
  }
  if (card.tags.includes("late") && scaling >= 62) {
    return "Os dois lados podem ganhar valor no late game; escolher esta carta aumenta a importância da execução tardia.";
  }
  return `Contra uma composição de ${enemyArchetype}, esta regra altera o ritmo para os dois times. Compare os pontos fortes do seu draft antes de confirmar.`;
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
