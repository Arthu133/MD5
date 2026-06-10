import type {
  DraftTeam,
  EnhancedChampion,
  GameDifficulty,
  ScoreCapReason,
  ScoreCapResult,
  TeamArchetype,
  TeamMetrics,
  TeamScore,
} from "../types/game";
import { applyItemsToChampion } from "./buildEngine";
import { calculateRoleFit } from "./roleEngine";

const clamp = (value: number, min = 0, max = 100) =>
  Math.round(Math.max(min, Math.min(max, value)));

const average = (values: number[]) =>
  values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;

const enhanceTeam = (team: DraftTeam): EnhancedChampion[] =>
  team.map((build) => applyItemsToChampion(build.champion, build.items));

const calculateMetrics = (
  team: DraftTeam,
  enhanced: EnhancedChampion[],
  difficulty: GameDifficulty,
): TeamMetrics => {
  const carry = enhanced[team.findIndex((build) => build.role === "Carry")];
  const roleFits = team.map((build) =>
    calculateRoleFit(build.champion, build.role, difficulty),
  );
  const roleFit = clamp(average(roleFits.map((fit) => fit.score)));
  const roleDeficit = 100 - roleFit;
  const jungleIndex = team.findIndex((build) => build.role === "Jungle");
  const jungleRoleFit = jungleIndex >= 0 ? roleFits[jungleIndex].score : 100;
  const physicalDamage = clamp(
    average(enhanced.map((champion) => champion.enhancedStats.damageAD)),
  );
  const magicDamage = clamp(
    average(enhanced.map((champion) => champion.enhancedStats.damageAP)),
  );
  const frontlineCandidates = enhanced.filter(
    (champion) =>
      champion.classes.includes("Tank") ||
      champion.classes.includes("Engager") ||
      champion.enhancedStats.tankiness >= 62,
  );
  const frontline = clamp(
    frontlineCandidates.length * 29 +
      average(frontlineCandidates.map((champion) => champion.enhancedStats.tankiness)) * 0.35,
  );

  return {
    physicalDamage,
    magicDamage,
    frontline,
    engage: clamp(average(enhanced.map((champion) => champion.enhancedStats.engage))),
    peel: clamp(
      average(enhanced.map((champion) => champion.enhancedStats.peel)) +
        ((carry?.enhancedStats.scaling ?? 0) >= 70 ? 4 : 0),
    ),
    crowdControl: clamp(average(enhanced.map((champion) => champion.enhancedStats.crowdControl))),
    scaling: clamp(average(enhanced.map((champion) => champion.enhancedStats.scaling))),
    earlyGame: clamp(
      average(enhanced.map((champion) => champion.enhancedStats.earlyPressure)) -
        roleDeficit * 0.28,
    ),
    objectiveControl: clamp(
      average(enhanced.map((champion) => champion.enhancedStats.objectiveControl)) -
        (100 - jungleRoleFit) * 0.34 -
        roleDeficit * 0.08,
    ),
    itemization: clamp(average(enhanced.map((champion) => champion.buildScore.total))),
    consistency: clamp(
      average(enhanced.map((champion) => champion.buildScore.consistency)) -
        roleDeficit * 0.42,
    ),
    executionDifficulty: clamp(
      average(enhanced.map((champion) => champion.difficulty * 10)) * 0.72 +
        (frontline < 35 ? 10 : 0) +
        (Math.min(physicalDamage, magicDamage) < 25 ? 6 : 0) +
        roleDeficit * 0.45,
    ),
    teamFight: clamp(average(enhanced.map((champion) => champion.enhancedStats.teamFight))),
    pickoff: clamp(average(enhanced.map((champion) => champion.enhancedStats.pickoff))),
    splitPush: clamp(average(enhanced.map((champion) => champion.enhancedStats.splitPush))),
    waveClear: clamp(average(enhanced.map((champion) => champion.enhancedStats.waveClear))),
    roleFit,
  };
};

export function calculateSynergyBonus(
  team: DraftTeam,
  difficulty: GameDifficulty = "Classic",
): number {
  const enhanced = enhanceTeam(team);
  if (!enhanced.length) return 0;
  const metrics = calculateMetrics(team, enhanced, difficulty);
  let bonus = 0;

  if (metrics.physicalDamage >= 35 && metrics.magicDamage >= 35) bonus += 6;
  if (metrics.frontline >= 48) bonus += 5;
  if (metrics.engage >= 52 && metrics.teamFight >= 58) bonus += 4;
  if (metrics.peel >= 50 && metrics.scaling >= 60) bonus += 4;
  if (metrics.objectiveControl >= 55) bonus += 3;
  if (metrics.itemization >= 78) bonus += 5;
  if (metrics.frontline < 25) bonus -= 7;
  if (Math.min(metrics.physicalDamage, metrics.magicDamage) < 20) bonus -= 5;
  if (metrics.itemization < 55) bonus -= 7;
  if (metrics.roleFit < 75) bonus -= 8;
  else if (metrics.roleFit < 88) bonus -= 3;

  return Math.round(bonus);
}

const archetypeScores = (metrics: TeamMetrics) => ({
  "Team Fight":
    metrics.teamFight * 0.33 +
    metrics.crowdControl * 0.25 +
    metrics.engage * 0.22 +
    metrics.frontline * 0.2,
  Pickoff:
    metrics.pickoff * 0.5 +
    metrics.engage * 0.16 +
    (100 - metrics.teamFight) * 0.08 +
    metrics.earlyGame * 0.12,
  "Split Push":
    metrics.splitPush * 0.58 +
    metrics.objectiveControl * 0.18 +
    metrics.earlyGame * 0.1,
  Poke:
    metrics.waveClear * 0.42 +
    metrics.magicDamage * 0.22 +
    metrics.pickoff * 0.13 +
    (100 - metrics.engage) * 0.08,
  "Protect the Carry":
    metrics.peel * 0.36 +
    metrics.frontline * 0.22 +
    metrics.scaling * 0.24 +
    metrics.teamFight * 0.12,
  "Early Snowball":
    metrics.earlyGame * 0.52 +
    metrics.pickoff * 0.18 +
    metrics.objectiveControl * 0.16 +
    (100 - metrics.scaling) * 0.06,
  Scaling:
    metrics.scaling * 0.5 +
    metrics.teamFight * 0.2 +
    metrics.waveClear * 0.16 +
    metrics.peel * 0.08,
  Balanced:
    (100 - Math.abs(metrics.physicalDamage - metrics.magicDamage)) * 0.2 +
    metrics.frontline * 0.14 +
    metrics.engage * 0.12 +
    metrics.peel * 0.12 +
    metrics.objectiveControl * 0.12 +
    metrics.consistency * 0.16,
});

export function detectTeamArchetype(
  team: DraftTeam,
  difficulty: GameDifficulty = "Classic",
): TeamArchetype {
  const enhanced = enhanceTeam(team);
  const metrics = calculateMetrics(team, enhanced, difficulty);
  const scores = archetypeScores(metrics);
  return (Object.entries(scores) as [TeamArchetype, number][]).sort(
    ([, left], [, right]) => right - left,
  )[0][0];
}

const determineStrengths = (metrics: TeamMetrics) => {
  const strengths: string[] = [];
  if (metrics.physicalDamage >= 38 && metrics.magicDamage >= 38) {
    strengths.push("Bom equilíbrio entre dano físico e mágico");
  }
  if (metrics.frontline >= 55) strengths.push("Linha de frente confiável para lutas longas");
  if (metrics.engage >= 58) strengths.push("Ferramentas claras para iniciar lutas");
  if (metrics.peel >= 56) strengths.push("Boa proteção para os carregadores");
  if (metrics.scaling >= 65) strengths.push("Curva de poder forte no fim do jogo");
  if (metrics.earlyGame >= 63) strengths.push("Pressão alta nas primeiras partidas");
  if (metrics.objectiveControl >= 60) strengths.push("Bom controle de objetivos e mapa");
  if (metrics.itemization >= 78) strengths.push("Builds coerentes com os campeões");
  if (metrics.roleFit >= 92) strengths.push("Campeões bem encaixados em suas posições");
  return strengths.slice(0, 5);
};

const determineWeaknesses = (metrics: TeamMetrics) => {
  const weaknesses: string[] = [];
  if (metrics.frontline < 38) weaknesses.push("Pouca linha de frente para absorver pressão");
  if (metrics.engage < 38) weaknesses.push("Dificuldade para começar lutas favoráveis");
  if (metrics.peel < 36) weaknesses.push("Carregadores expostos a ameaças móveis");
  if (Math.min(metrics.physicalDamage, metrics.magicDamage) < 25) {
    weaknesses.push("Perfil de dano previsível e fácil de defender");
  }
  if (metrics.earlyGame < 42) weaknesses.push("Início lento e vulnerável a snowball");
  if (metrics.scaling < 45) weaknesses.push("Perde força se a campanha se alongar");
  if (metrics.itemization < 62) weaknesses.push("Itens pouco alinhados com o plano do draft");
  if (metrics.roleFit < 75) {
    weaknesses.push("Escolhas fora de rota reduziram a clareza da composição");
  }
  if (metrics.executionDifficulty >= 72) weaknesses.push("Execução exigente e pouco consistente");
  return weaknesses.slice(0, 5);
};

const determineWinCondition = (archetype: TeamArchetype) => {
  const conditions: Record<TeamArchetype, string> = {
    "Team Fight": "forçar lutas 5v5 com iniciação coordenada",
    Pickoff: "controlar visão e eliminar alvos isolados",
    "Split Push": "abrir o mapa com pressão lateral constante",
    Poke: "desgastar o inimigo antes de disputar objetivos",
    "Protect the Carry": "proteger o principal carregador durante lutas longas",
    "Early Snowball": "criar vantagem cedo e acelerar os objetivos",
    Scaling: "sobreviver ao início e alcançar os picos tardios",
    Balanced: "adaptar o ritmo e vencer pela consistência",
  };
  return conditions[archetype];
};

const roleLevelLabel = {
  Natural: "Natural",
  Flex: "Flexível",
  OffMeta: "Fora do meta",
  Bad: "Ruim",
  Terrible: "Péssimo",
} as const;

const teamScoreWeights = {
  roleFit: 0.14,
  championStrength: 0.08,
  itemizationQuality: 0.17,
  buildCoherence: 0.11,
  damageProfile: 0.09,
  frontlineAndDurability: 0.07,
  engageOrAlternativePlan: 0.08,
  peelAndCarryProtection: 0.06,
  objectiveControl: 0.06,
  waveClearAndMapControl: 0.05,
  winConditionClarity: 0.09,
} as const;

const calculateChampionStrength = (
  team: DraftTeam,
  enhanced: EnhancedChampion[],
  difficulty: GameDifficulty,
) =>
  clamp(
    average(
      team.map((build, index) => {
        const champion = enhanced[index];
        const stats = champion.enhancedStats;
        const roleFit = calculateRoleFit(
          build.champion,
          build.role,
          difficulty,
        ).score;
        const rolePower =
          build.role === "Top"
            ? average([stats.tankiness, stats.splitPush, stats.sustain])
            : build.role === "Jungle"
              ? average([
                  stats.objectiveControl,
                  stats.earlyPressure,
                  stats.mobility,
                ])
              : build.role === "Mid"
                ? average([
                    Math.max(stats.damageAD, stats.damageAP),
                    stats.waveClear,
                    stats.pickoff,
                  ])
                : build.role === "Carry"
                  ? average([
                      Math.max(stats.damageAD, stats.damageAP),
                      stats.scaling,
                      stats.teamFight,
                    ])
                  : average([
                      Math.max(stats.peel, stats.engage),
                      stats.crowdControl,
                      stats.utility,
                    ]);
        return rolePower * 0.72 + roleFit * 0.28;
      }),
    ),
  );

const calculateBuildCoherence = (enhanced: EnhancedChampion[]) =>
  clamp(
    average(
      enhanced.map(
        (champion) =>
          champion.buildScore.identityAlignment * 0.55 +
          champion.buildScore.averageItemFit * 0.3 +
          champion.buildScore.consistency * 0.15,
      ),
    ),
  );

const calculateWinConditionClarity = (
  metrics: TeamMetrics,
  archetype: TeamArchetype,
) => {
  const planScores: Record<TeamArchetype, number> = {
    "Team Fight": average([
      metrics.teamFight,
      metrics.engage,
      metrics.crowdControl,
      Math.max(metrics.frontline, metrics.peel),
    ]),
    Pickoff: average([
      metrics.pickoff,
      metrics.earlyGame,
      metrics.crowdControl,
      metrics.objectiveControl,
    ]),
    "Split Push": average([
      metrics.splitPush,
      metrics.waveClear,
      metrics.objectiveControl,
      metrics.earlyGame,
    ]),
    Poke: average([
      metrics.waveClear,
      metrics.pickoff,
      metrics.peel,
      metrics.objectiveControl,
    ]),
    "Protect the Carry": average([
      metrics.peel,
      metrics.frontline,
      metrics.scaling,
      metrics.teamFight,
    ]),
    "Early Snowball": average([
      metrics.earlyGame,
      metrics.pickoff,
      metrics.objectiveControl,
      metrics.engage,
    ]),
    Scaling: average([
      metrics.scaling,
      metrics.waveClear,
      Math.max(metrics.frontline, metrics.peel),
      metrics.teamFight,
    ]),
    Balanced: average([
      metrics.consistency,
      metrics.roleFit,
      metrics.itemization,
      metrics.objectiveControl,
    ]),
  };
  const damageReliability = clamp(
    Math.max(metrics.physicalDamage, metrics.magicDamage) * 1.25,
  );
  let clarity = planScores[archetype] * 0.78 + damageReliability * 0.22;
  if (
    archetype === "Scaling" &&
    Math.max(metrics.frontline, metrics.peel) < 40
  ) {
    clarity -= 20;
  }
  if (
    archetype === "Protect the Carry" &&
    (metrics.frontline < 42 || metrics.peel < 48)
  ) {
    clarity -= 16;
  }
  if (
    archetype === "Early Snowball" &&
    Math.max(metrics.engage, metrics.pickoff) < 48
  ) {
    clarity -= 15;
  }
  return clamp(clarity);
};

const addCap = (
  reasons: ScoreCapReason[],
  cap: number,
  reason: string,
  condition: boolean,
) => {
  if (condition) reasons.push({ cap, reason });
};

export function calculateDraftScoreCap(
  team: DraftTeam,
  baseScore: number,
  difficulty: GameDifficulty = "Classic",
): ScoreCapResult {
  const enhanced = enhanceTeam(team);
  const metrics = calculateMetrics(team, enhanced, difficulty);
  const archetype = (
    Object.entries(archetypeScores(metrics)) as [TeamArchetype, number][]
  ).sort(([, left], [, right]) => right - left)[0][0];
  const winConditionClarity = calculateWinConditionClarity(metrics, archetype);
  const roleFits = team.map((build) =>
    calculateRoleFit(build.champion, build.role, difficulty),
  );
  const offRoleCount = roleFits.filter((fit) => fit.score < 85).length;
  const carryIndex = team.findIndex((build) => build.role === "Carry");
  const jungleIndex = team.findIndex((build) => build.role === "Jungle");
  const carryBuild =
    carryIndex >= 0 ? enhanced[carryIndex].buildScore.total : 0;
  const jungleRoleFit =
    jungleIndex >= 0 ? roleFits[jungleIndex].score : 0;
  const itemStats = team.flatMap((build) => build.items);
  const antiTank = itemStats.reduce(
    (total, item) =>
      total +
      (item.stats.antiTank ?? 0) +
      (item.stats.armorPen ?? 0) * 0.5 +
      (item.stats.magicPen ?? 0) * 0.5,
    0,
  );
  const snowball = itemStats.reduce(
    (total, item) =>
      total +
      (item.stats.snowball ?? 0) +
      (item.stats.earlyPressure ?? 0),
    0,
  );
  const reliableDamage =
    Math.max(metrics.physicalDamage, metrics.magicDamage) >= 34 &&
    carryBuild >= 42;
  const alternativePlan = Math.max(
    metrics.waveClear,
    metrics.splitPush,
    metrics.pickoff,
  );
  const fullAD =
    metrics.physicalDamage - metrics.magicDamage >= 32;
  const fullAP =
    metrics.magicDamage - metrics.physicalDamage >= 32;
  const reasons: ScoreCapReason[] = [];

  addCap(
    reasons,
    45,
    "A nota foi limitada porque a composição não tem uma fonte confiável de dano.",
    !reliableDamage,
  );
  addCap(
    reasons,
    55,
    "A nota foi limitada porque a composição não apresenta uma condição de vitória clara.",
    winConditionClarity < 45,
  );
  addCap(
    reasons,
    60,
    "A nota foi limitada porque o Carry está mal itemizado para uma composição que depende de proteção.",
    archetype === "Protect the Carry" && carryBuild < 50,
  );
  addCap(
    reasons,
    65,
    "A nota foi limitada porque a Jungle não oferece encaixe, pressão ou controle de objetivos confiável.",
    jungleRoleFit < 45 || metrics.objectiveControl < 30,
  );
  addCap(
    reasons,
    55,
    "A nota foi limitada porque três ou mais campeões estão fora de posição.",
    offRoleCount >= 3,
  );
  addCap(
    reasons,
    68,
    "A nota foi limitada porque o dano é quase todo físico sem anti-tank ou snowball suficiente.",
    fullAD && antiTank < 35 && snowball < 45,
  );
  addCap(
    reasons,
    68,
    "A nota foi limitada porque o dano é quase todo mágico sem controle suficiente.",
    fullAP && metrics.crowdControl < 52,
  );
  addCap(
    reasons,
    62,
    "A nota foi limitada porque falta frontline e também não existe um plano forte de poke, pickoff ou split push.",
    metrics.frontline < 30 && alternativePlan < 58,
  );
  addCap(
    reasons,
    58,
    "A nota foi limitada porque o time reúne campeões frágeis sem frontline, engage ou proteção suficientes.",
    metrics.frontline < 18 &&
      metrics.engage < 35 &&
      metrics.peel < 40 &&
      metrics.waveClear < 72 &&
      metrics.pickoff < 68 &&
      metrics.splitPush < 65,
  );
  addCap(
    reasons,
    65,
    "A nota foi limitada porque falta engage e não há um plano alternativo claro.",
    metrics.engage < 30 && alternativePlan < 58,
  );
  addCap(
    reasons,
    70,
    "A nota foi limitada porque a composição tem wave clear insuficiente.",
    metrics.waveClear < 34,
  );
  addCap(
    reasons,
    60,
    "A nota foi limitada porque a itemização média ficou abaixo de 45.",
    metrics.itemization < 45,
  );
  addCap(
    reasons,
    48,
    "A nota foi limitada porque a itemização média ficou abaixo de 30.",
    metrics.itemization < 30,
  );

  const finalCap = Math.min(
    100,
    baseScore,
    ...reasons.map((entry) => entry.cap),
  );
  return {
    finalCap,
    reasons: reasons.sort((left, right) => left.cap - right.cap),
  };
}

export function calculateTeamScore(
  team: DraftTeam,
  difficulty: GameDifficulty = "Classic",
): TeamScore {
  const enhanced = enhanceTeam(team);
  const metrics = calculateMetrics(team, enhanced, difficulty);
  const archetype = detectTeamArchetype(team, difficulty);
  const synergyBonus = calculateSynergyBonus(team, difficulty);
  const damageBalance = clamp(100 - Math.abs(metrics.physicalDamage - metrics.magicDamage));
  const championStrength = calculateChampionStrength(
    team,
    enhanced,
    difficulty,
  );
  const buildCoherence = calculateBuildCoherence(enhanced);
  const winConditionClarity = calculateWinConditionClarity(
    metrics,
    archetype,
  );
  const alternativePlan = Math.max(
    metrics.engage,
    metrics.waveClear,
    metrics.pickoff,
    metrics.splitPush,
  );
  const rawTotal = clamp(
    metrics.roleFit * teamScoreWeights.roleFit +
      championStrength * teamScoreWeights.championStrength +
      metrics.itemization * teamScoreWeights.itemizationQuality +
      buildCoherence * teamScoreWeights.buildCoherence +
      damageBalance * teamScoreWeights.damageProfile +
      metrics.frontline * teamScoreWeights.frontlineAndDurability +
      alternativePlan * teamScoreWeights.engageOrAlternativePlan +
      metrics.peel * teamScoreWeights.peelAndCarryProtection +
      metrics.objectiveControl * teamScoreWeights.objectiveControl +
      metrics.waveClear * teamScoreWeights.waveClearAndMapControl +
      winConditionClarity * teamScoreWeights.winConditionClarity +
      Math.max(-5, Math.min(4, synergyBonus * 0.45)),
  );
  const scoreCap = calculateDraftScoreCap(team, rawTotal, difficulty);
  const total = Math.min(rawTotal, scoreCap.finalCap);
  const itemWarnings = team.flatMap((build, index) =>
    enhanced[index].buildScore.warnings.map(
      (warning) => `${build.champion.name}: ${warning}`,
    ),
  );
  const roleWarnings = team.flatMap((build) => {
    const fit = calculateRoleFit(build.champion, build.role, difficulty);
    if (fit.score >= 85) return [];
    return [
      `${build.role}: ${build.champion.name} foi avaliado como ${roleLevelLabel[fit.level]} (${fit.score}/100). ${fit.penalties[0] ?? "A escolha aumenta o risco da composição."}`,
    ];
  });

  return {
    total,
    rawTotal,
    scoreCap,
    archetype,
    metrics,
    synergyBonus,
    championStrength,
    buildCoherence,
    damageBalance,
    winConditionClarity,
    strengths: determineStrengths(metrics),
    weaknesses: determineWeaknesses(metrics),
    warnings: scoreCap.reasons
      .filter((entry) => entry.cap < rawTotal)
      .map((entry) => entry.reason),
    itemWarnings: itemWarnings.slice(0, 6),
    roleWarnings,
    winCondition: determineWinCondition(archetype),
  };
}
