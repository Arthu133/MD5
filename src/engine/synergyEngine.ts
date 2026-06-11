import type {
  DraftTeam,
  GameDifficulty,
  ScoreCapReason,
  ScoreCapResult,
  StrategicStats,
  TeamArchetype,
  TeamMetrics,
  TeamScore,
} from "../types/game";
import { calculateRoleFit } from "./roleEngine";
import { analyzeTeamIdentity } from "./teamIdentityEngine";

const clamp = (value: number, min = 0, max = 100) =>
  Math.round(Math.max(min, Math.min(max, value)));

const average = (values: number[]) =>
  values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;

const statsFor = (team: DraftTeam): StrategicStats[] =>
  team.map((build) => build.champion.stats);

const calculateMetrics = (
  team: DraftTeam,
  difficulty: GameDifficulty,
): TeamMetrics => {
  const stats = statsFor(team);
  const roleFits = team.map((build) =>
    calculateRoleFit(build.champion, build.role, difficulty),
  );
  const roleFit = clamp(average(roleFits.map((fit) => fit.score)));
  const roleDeficit = 100 - roleFit;
  const carryIndex = team.findIndex((build) => build.role === "Carry");
  const jungleIndex = team.findIndex((build) => build.role === "Jungle");
  const carry = carryIndex >= 0 ? stats[carryIndex] : undefined;
  const jungleFit = jungleIndex >= 0 ? roleFits[jungleIndex].score : 100;
  const physicalDamage = clamp(average(stats.map((entry) => entry.damageAD)));
  const magicDamage = clamp(average(stats.map((entry) => entry.damageAP)));
  const frontlineCandidates = team.filter(
    ({ champion }) =>
      champion.classes.includes("Tank") ||
      champion.classes.includes("Engager") ||
      champion.stats.tankiness >= 62,
  );
  const frontline = clamp(
    frontlineCandidates.length * 28 +
      average(
        frontlineCandidates.map(({ champion }) => champion.stats.tankiness),
      ) *
        0.34,
  );
  const engage = clamp(average(stats.map((entry) => entry.engage)));
  const peel = clamp(
    average(stats.map((entry) => entry.peel)) +
      ((carry?.scaling ?? 0) >= 70 ? 4 : 0),
  );
  const crowdControl = clamp(
    average(stats.map((entry) => entry.crowdControl)),
  );
  const scaling = clamp(average(stats.map((entry) => entry.scaling)));
  const earlyGame = clamp(
    average(stats.map((entry) => entry.earlyPressure)) - roleDeficit * 0.3,
  );
  const objectiveControl = clamp(
    average(stats.map((entry) => entry.objectiveControl)) -
      (100 - jungleFit) * 0.34 -
      roleDeficit * 0.08,
  );
  const teamFight = clamp(average(stats.map((entry) => entry.teamFight)));
  const pickoff = clamp(average(stats.map((entry) => entry.pickoff)));
  const splitPush = clamp(average(stats.map((entry) => entry.splitPush)));
  const waveClear = clamp(average(stats.map((entry) => entry.waveClear)));
  const flexibility = average(
    team.map(({ champion }) => Math.min(100, 50 + champion.roles.length * 14)),
  );
  const planCoherence = average([
    Math.max(teamFight, pickoff, splitPush, waveClear),
    Math.max(engage, peel),
    objectiveControl,
    roleFit,
  ]);

  const baseMetrics: TeamMetrics = {
    physicalDamage,
    magicDamage,
    frontline,
    engage,
    peel,
    crowdControl,
    scaling,
    earlyGame,
    objectiveControl,
    cardSynergy: clamp(planCoherence * 0.72 + 18),
    rulesAdaptation: clamp(flexibility * 0.55 + roleFit * 0.45),
    consistency: clamp(
      average([
        roleFit,
        objectiveControl,
        Math.max(frontline, peel),
        100 - Math.abs(physicalDamage - magicDamage) * 0.55,
      ]) - roleDeficit * 0.2,
    ),
    executionDifficulty: clamp(
      average(team.map(({ champion }) => champion.difficulty * 10)) * 0.7 +
        (frontline < 35 ? 10 : 0) +
        (Math.min(physicalDamage, magicDamage) < 24 ? 6 : 0) +
        roleDeficit * 0.45,
    ),
    teamFight,
    pickoff,
    splitPush,
    waveClear,
    roleFit,
  };
  const identity = analyzeTeamIdentity(team);
  const profile = identity.attributeProfile;
  const blend = (current: number, key: keyof typeof profile, weight = 0.22) =>
    clamp(current * (1 - weight) + (profile[key] ?? current) * weight);

  return {
    ...baseMetrics,
    frontline: blend(baseMetrics.frontline, "frontline"),
    engage: blend(baseMetrics.engage, "engage"),
    peel: blend(baseMetrics.peel, "peel"),
    crowdControl: blend(baseMetrics.crowdControl, "crowdControl"),
    scaling: blend(baseMetrics.scaling, "scaling"),
    earlyGame: blend(baseMetrics.earlyGame, "earlyGame"),
    objectiveControl: blend(baseMetrics.objectiveControl, "objectiveControl"),
    teamFight: blend(baseMetrics.teamFight, "teamFight"),
    pickoff: blend(baseMetrics.pickoff, "pickoff"),
    splitPush: blend(baseMetrics.splitPush, "splitPush"),
    waveClear: blend(baseMetrics.waveClear, "waveClear"),
  };
};

const archetypeScores = (metrics: TeamMetrics) => ({
  "Team Fight":
    metrics.teamFight * 0.33 +
    metrics.crowdControl * 0.25 +
    metrics.engage * 0.22 +
    metrics.frontline * 0.2,
  Pickoff:
    metrics.pickoff * 0.5 +
    metrics.engage * 0.16 +
    metrics.earlyGame * 0.12 +
    (100 - metrics.teamFight) * 0.08,
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
  if (!team.length) return "Balanced";
  const identity = analyzeTeamIdentity(team);
  const metrics = calculateMetrics(team, difficulty);
  const legacy = identity.legacyArchetype;
  const legacyScore = archetypeScores(metrics)[legacy];
  const strongestLegacy = (
    Object.entries(archetypeScores(metrics)) as [TeamArchetype, number][]
  ).sort(([, left], [, right]) => right - left)[0];
  return legacyScore >= strongestLegacy[1] - 8 ? legacy : strongestLegacy[0];
}

export function calculateSynergyBonus(
  team: DraftTeam,
  difficulty: GameDifficulty = "Classic",
): number {
  if (!team.length) return 0;
  const metrics = calculateMetrics(team, difficulty);
  let bonus = 0;
  if (metrics.physicalDamage >= 35 && metrics.magicDamage >= 35) bonus += 6;
  if (metrics.frontline >= 48) bonus += 5;
  if (metrics.engage >= 52 && metrics.teamFight >= 58) bonus += 4;
  if (metrics.peel >= 50 && metrics.scaling >= 60) bonus += 4;
  if (metrics.objectiveControl >= 55) bonus += 3;
  if (metrics.cardSynergy >= 75) bonus += 4;
  if (metrics.frontline < 25) bonus -= 7;
  if (Math.min(metrics.physicalDamage, metrics.magicDamage) < 20) bonus -= 5;
  if (metrics.roleFit < 75) bonus -= 8;
  else if (metrics.roleFit < 88) bonus -= 3;
  return Math.round(bonus);
}

const calculateChampionStrength = (
  team: DraftTeam,
  difficulty: GameDifficulty,
) =>
  clamp(
    average(
      team.map((build) => {
        const stats = build.champion.stats;
        const fit = calculateRoleFit(
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
        return rolePower * 0.72 + fit * 0.28;
      }),
    ),
  );

const calculateWinConditionClarity = (
  metrics: TeamMetrics,
  archetype: TeamArchetype,
) => {
  const plans: Record<TeamArchetype, number[]> = {
    "Team Fight": [
      metrics.teamFight,
      metrics.engage,
      metrics.crowdControl,
      Math.max(metrics.frontline, metrics.peel),
    ],
    Pickoff: [
      metrics.pickoff,
      metrics.earlyGame,
      metrics.crowdControl,
      metrics.objectiveControl,
    ],
    "Split Push": [
      metrics.splitPush,
      metrics.waveClear,
      metrics.objectiveControl,
      metrics.earlyGame,
    ],
    Poke: [
      metrics.waveClear,
      metrics.pickoff,
      metrics.peel,
      metrics.objectiveControl,
    ],
    "Protect the Carry": [
      metrics.peel,
      metrics.frontline,
      metrics.scaling,
      metrics.teamFight,
    ],
    "Early Snowball": [
      metrics.earlyGame,
      metrics.pickoff,
      metrics.objectiveControl,
      metrics.engage,
    ],
    Scaling: [
      metrics.scaling,
      metrics.waveClear,
      Math.max(metrics.frontline, metrics.peel),
      metrics.teamFight,
    ],
    Balanced: [
      metrics.consistency,
      metrics.roleFit,
      metrics.rulesAdaptation,
      metrics.objectiveControl,
    ],
  };
  return clamp(
    average(plans[archetype]) * 0.82 +
      Math.max(metrics.physicalDamage, metrics.magicDamage) * 0.22,
  );
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
  const metrics = calculateMetrics(team, difficulty);
  const archetype = detectTeamArchetype(team, difficulty);
  const clarity = calculateWinConditionClarity(metrics, archetype);
  const offRoleCount = team.filter(
    (build) =>
      calculateRoleFit(build.champion, build.role, difficulty).score < 85,
  ).length;
  const alternativePlan = Math.max(
    metrics.waveClear,
    metrics.splitPush,
    metrics.pickoff,
  );
  const reasons: ScoreCapReason[] = [];

  addCap(reasons, 48, "A composição não tem uma fonte confiável de dano.", Math.max(metrics.physicalDamage, metrics.magicDamage) < 34);
  addCap(reasons, 58, "A composição não apresenta uma condição de vitória clara.", clarity < 45);
  addCap(reasons, 57, "Três ou mais campeões estão fora de posição.", offRoleCount >= 3);
  addCap(reasons, 70, "O perfil de dano é quase totalmente físico.", metrics.physicalDamage - metrics.magicDamage >= 34);
  addCap(reasons, 70, "O perfil de dano é quase totalmente mágico.", metrics.magicDamage - metrics.physicalDamage >= 34);
  addCap(reasons, 64, "Falta frontline e também não existe um plano alternativo forte.", metrics.frontline < 30 && alternativePlan < 58);
  addCap(reasons, 60, "O time é frágil e não tem engage ou proteção suficientes.", metrics.frontline < 18 && metrics.engage < 35 && metrics.peel < 40);
  addCap(reasons, 67, "Falta engage e não há plano alternativo claro.", metrics.engage < 30 && alternativePlan < 58);
  addCap(reasons, 72, "A composição tem wave clear insuficiente.", metrics.waveClear < 34);
  addCap(reasons, 66, "A Jungle não oferece controle de objetivos confiável.", metrics.objectiveControl < 30);

  return {
    finalCap: Math.min(100, baseScore, ...reasons.map((entry) => entry.cap)),
    reasons: reasons.sort((left, right) => left.cap - right.cap),
  };
}

const determineStrengths = (metrics: TeamMetrics) => {
  const strengths: string[] = [];
  if (metrics.physicalDamage >= 38 && metrics.magicDamage >= 38) strengths.push("Bom equilíbrio entre dano físico e mágico");
  if (metrics.frontline >= 55) strengths.push("Linha de frente confiável para lutas longas");
  if (metrics.engage >= 58) strengths.push("Ferramentas claras para iniciar lutas");
  if (metrics.peel >= 56) strengths.push("Boa proteção para os carregadores");
  if (metrics.scaling >= 65) strengths.push("Curva de poder forte no fim do jogo");
  if (metrics.earlyGame >= 63) strengths.push("Pressão alta nas primeiras rotações");
  if (metrics.objectiveControl >= 60) strengths.push("Bom controle de objetivos e mapa");
  if (metrics.roleFit >= 92) strengths.push("Campeões bem encaixados em suas posições");
  return strengths.slice(0, 5);
};

const determineWeaknesses = (metrics: TeamMetrics) => {
  const weaknesses: string[] = [];
  if (metrics.frontline < 38) weaknesses.push("Pouca linha de frente para absorver pressão");
  if (metrics.engage < 38) weaknesses.push("Dificuldade para começar lutas favoráveis");
  if (metrics.peel < 36) weaknesses.push("Carregadores expostos a ameaças móveis");
  if (Math.min(metrics.physicalDamage, metrics.magicDamage) < 25) weaknesses.push("Perfil de dano previsível e fácil de defender");
  if (metrics.earlyGame < 42) weaknesses.push("Início lento e vulnerável a snowball");
  if (metrics.scaling < 45) weaknesses.push("Perde força se a campanha se alongar");
  if (metrics.roleFit < 75) weaknesses.push("Escolhas fora de rota reduziram a clareza da composição");
  if (metrics.executionDifficulty >= 72) weaknesses.push("Execução exigente e pouco consistente");
  return weaknesses.slice(0, 5);
};

const roleLevelLabel = {
  Natural: "Natural",
  Flex: "Flexível",
  OffMeta: "Fora do meta",
  Bad: "Ruim",
  Terrible: "Péssimo",
} as const;

export function calculateTeamScore(
  team: DraftTeam,
  difficulty: GameDifficulty = "Classic",
): TeamScore {
  const metrics = calculateMetrics(team, difficulty);
  const identity = analyzeTeamIdentity(team);
  const archetype = detectTeamArchetype(team, difficulty);
  const synergyBonus = calculateSynergyBonus(team, difficulty);
  const damageBalance = clamp(
    100 - Math.abs(metrics.physicalDamage - metrics.magicDamage),
  );
  const championStrength = calculateChampionStrength(team, difficulty);
  const winConditionClarity = clamp(
    calculateWinConditionClarity(metrics, archetype) * 0.72 +
      identity.confidence * 0.28,
  );
  const alternativePlan = Math.max(
    metrics.engage,
    metrics.waveClear,
    metrics.pickoff,
    metrics.splitPush,
  );
  const rawTotal = clamp(
    metrics.roleFit * 0.17 +
      championStrength * 0.13 +
      metrics.cardSynergy * 0.11 +
      metrics.rulesAdaptation * 0.08 +
      damageBalance * 0.08 +
      metrics.frontline * 0.07 +
      alternativePlan * 0.08 +
      metrics.peel * 0.06 +
      metrics.objectiveControl * 0.07 +
      metrics.waveClear * 0.05 +
      winConditionClarity * 0.1 +
      Math.max(-5, Math.min(4, synergyBonus * 0.45)),
  );
  const scoreCap = calculateDraftScoreCap(team, rawTotal, difficulty);
  const roleWarnings = team.flatMap((build) => {
    const fit = calculateRoleFit(build.champion, build.role, difficulty);
    if (fit.score >= 85) return [];
    return [
      `${build.role}: ${build.champion.name} foi avaliado como ${roleLevelLabel[fit.level]} (${fit.score}/100). ${fit.penalties[0] ?? "A escolha aumenta o risco da composição."}`,
    ];
  });

  return {
    total: Math.min(rawTotal, scoreCap.finalCap),
    rawTotal,
    scoreCap,
    archetype,
    identity,
    metrics,
    synergyBonus,
    championStrength,
    cardSynergy: metrics.cardSynergy,
    rulesAdaptation: metrics.rulesAdaptation,
    damageBalance,
    winConditionClarity,
    strengths: [...new Set([...identity.strengths, ...determineStrengths(metrics)])].slice(0, 5),
    weaknesses: [...new Set([...identity.weaknesses, ...determineWeaknesses(metrics)])].slice(0, 5),
    warnings: scoreCap.reasons
      .filter((entry) => entry.cap < rawTotal)
      .map((entry) => entry.reason),
    roleWarnings,
    winCondition: `jogar por ${identity.primaryWinCondition.toLowerCase()}${
      identity.secondaryWinConditions.length
        ? ` com apoio de ${identity.secondaryWinConditions
            .map((condition) => condition.toLowerCase())
            .join(" e ")}`
        : ""
    }`,
  };
}
