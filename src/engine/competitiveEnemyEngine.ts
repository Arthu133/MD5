import { championProfiles } from "../data/champions/championProfiles";
import { competitiveCompTemplates } from "../data/meta/competitiveComps";
import {
  competitiveMetaByChampion,
  tierWeights,
  tournamentDifficultyScaling,
} from "../data/meta/competitiveMeta";
import { enemyOrganizations } from "../data/meta/enemyOrganizations";
import type {
  ChampionMetaProfile,
  ChampionMetaRoleProfile,
  ChampionProfile,
  CompetitiveCompTemplate,
  CompetitiveEnemyTeam,
  DraftTeam,
  DraftValidationResult,
  EnemyOrganizationProfile,
  EnemyTier,
  GameDifficulty,
  Item,
  MetaPlaystyle,
  MetaTier,
  Role,
  TeamArchetype,
  TeamScore,
  TournamentStage,
} from "../types/game";
import { ROLES } from "../types/game";
import { calculateRoleFit } from "./roleEngine";
import { calculateTeamScore } from "./synergyEngine";

const clamp = (value: number, min = 0, max = 100) =>
  Math.round(Math.max(min, Math.min(max, value)));

const average = (values: number[]) =>
  values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;

const weightedPick = <T,>(
  candidates: T[],
  getWeight: (candidate: T) => number,
): T => {
  const weights = candidates.map((entry) => Math.max(0.01, getWeight(entry)));
  let cursor = Math.random() * weights.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < candidates.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return candidates[index];
  }
  return candidates[candidates.length - 1];
};

const archetypePlaystyles: Record<TeamArchetype, MetaPlaystyle[]> = {
  "Team Fight": ["FrontToBack", "ControlMid", "EngageSupport"],
  Pickoff: ["PickComp", "Dive"],
  "Split Push": ["SplitMap", "StrongSideTop"],
  Poke: ["Poke", "ControlMid"],
  "Protect the Carry": ["EnchanterScaling", "ScalingBot", "FrontToBack"],
  "Early Snowball": ["ObjectiveStacking", "LaneDominantBot", "CarryJungle"],
  Scaling: ["ScalingBot", "ControlMid", "FrontToBack"],
  Balanced: ["FrontToBack", "ObjectiveStacking", "ControlMid"],
};

const fallbackTier = (champion: ChampionProfile, role: Role): MetaTier => {
  const roleFit = calculateRoleFit(champion, role, "Classic").score;
  if (roleFit >= 95 && champion.difficulty <= 7) return "B";
  if (roleFit >= 85) return "C";
  return "OffMeta";
};

export const getChampionMetaRoleProfile = (
  champion: ChampionProfile,
  role: Role,
): ChampionMetaRoleProfile => {
  const curated = competitiveMetaByChampion.get(champion.id)?.roles[role];
  if (curated) return curated;
  const tier = fallbackTier(champion, role);
  const roleFit = calculateRoleFit(champion, role, "Classic").score;
  const base = tier === "B" ? 61 : tier === "C" ? 43 : 18;
  return {
    tier,
    priority: clamp(base + roleFit * 0.12),
    proPresence: clamp(base - 3),
    blindPickSafety: clamp(base + (champion.roles.length > 1 ? 7 : 0)),
    counterPickPower: clamp(base + champion.stats.pickoff * 0.08),
    scalingReliability: champion.stats.scaling,
    earlyGameReliability: champion.stats.earlyPressure,
  };
};

const getMetaProfile = (
  champion: ChampionProfile,
  role: Role,
): ChampionMetaProfile =>
  competitiveMetaByChampion.get(champion.id) ?? {
    championId: champion.id,
    championName: champion.name,
    roles: { [role]: getChampionMetaRoleProfile(champion, role) },
    playstyles: [],
    strongWith: [],
    weakWith: [],
    goodAgainstArchetypes: [],
    badAgainstArchetypes: [],
    defaultBuildArchetypes: [],
  };

export function getMetaWeightedChampionForRole(
  role: Role,
  tournamentDifficulty: number,
  desiredArchetype: TeamArchetype,
  alreadyPickedChampionIds: string[],
): ChampionProfile {
  const candidates = championProfiles.filter(
    (champion) =>
      champion.roles.includes(role) &&
      !alreadyPickedChampionIds.includes(champion.id),
  );
  const desiredStyles = archetypePlaystyles[desiredArchetype];
  return weightedPick(candidates, (champion) => {
    const roleMeta = getChampionMetaRoleProfile(champion, role);
    const meta = getMetaProfile(champion, role);
    const styleMatches = meta.playstyles.filter((style) =>
      desiredStyles.includes(style),
    ).length;
    const difficultyBias =
      1 +
      (tournamentDifficulty / 100) *
        (roleMeta.tier === "S"
          ? 1.7
          : roleMeta.tier === "A"
            ? 1.15
            : roleMeta.tier === "B"
              ? 0.35
              : -0.35);
    const competitiveValue =
      roleMeta.priority * 0.35 +
      roleMeta.proPresence * 0.2 +
      roleMeta.blindPickSafety * 0.15 +
      roleMeta.counterPickPower * 0.1 +
      roleMeta.scalingReliability * 0.1 +
      roleMeta.earlyGameReliability * 0.1;
    return Math.max(
      0.05,
      tierWeights[roleMeta.tier] *
        difficultyBias *
        (1 + styleMatches * 0.42) *
        (0.55 + competitiveValue / 100),
    );
  });
}

// Mantido como adaptador para integrações antigas. Itens não participam mais do jogo.
export function generateMetaBuildForChampion(
  _champion: ChampionProfile,
  _role: Role,
  _template: CompetitiveCompTemplate,
  _enemyDifficulty: number,
): Item[] {
  return [];
}

export function validateEnemyDraft(team: DraftTeam): DraftValidationResult {
  const score = calculateTeamScore(team, "Classic");
  const problems: string[] = [];
  const jungle = team.find((build) => build.role === "Jungle");
  const carry = team.find((build) => build.role === "Carry");
  const support = team.find((build) => build.role === "Support");
  const top = team.find((build) => build.role === "Top");
  const mid = team.find((build) => build.role === "Mid");

  if (!jungle || calculateRoleFit(jungle.champion, "Jungle", "Classic").score < 85) problems.push("sem jungle funcional");
  if (!carry || Math.max(carry.champion.stats.damageAD, carry.champion.stats.damageAP) < 58) problems.push("sem fonte real de dano no carry");
  if (!support || Math.max(support.champion.stats.peel, support.champion.stats.engage, support.champion.stats.utility) < 50) problems.push("support sem função competitiva");
  if (!top || top.champion.stats.tankiness < 30) problems.push("top sem resistência suficiente");
  if (!mid || mid.champion.stats.waveClear < 42) problems.push("mid com pouco wave clear");
  if (score.metrics.frontline < 30 && ["Team Fight", "Scaling", "Protect the Carry"].includes(score.archetype)) problems.push("composição de luta sem frontline");
  if (Math.min(score.metrics.physicalDamage, score.metrics.magicDamage) < 18) problems.push("perfil de dano extremamente previsível");
  if (score.metrics.earlyGame < 32 && score.metrics.scaling < 58) problems.push("sem pressão inicial ou escala confiável");

  const validationScore = clamp(
    score.total * 0.5 +
      score.metrics.roleFit * 0.2 +
      score.metrics.consistency * 0.12 +
      score.metrics.rulesAdaptation * 0.1 +
      Math.min(score.metrics.frontline, 70) * 0.08 -
      problems.length * 5,
  );
  return {
    valid: validationScore >= 55 && !problems.includes("sem jungle funcional"),
    score: validationScore,
    problems,
  };
}

const stageTierPool: Record<TournamentStage, EnemyTier[]> = {
  Groups: ["Wildcard", "Regional", "Major"],
  Quarterfinals: ["Regional", "Major"],
  Semifinals: ["Major", "Elite"],
  Final: ["Elite", "Champion"],
};

const stageBaseDifficulty: Record<TournamentStage, number> = {
  Groups: 52,
  Quarterfinals: 66,
  Semifinals: 76,
  Final: 84,
};

const groupStrengthDifficultyModifier = {
  weak: -10,
  medium: -5,
  strong: 2,
} as const;

const validationThreshold: Record<TournamentStage, number> = {
  Groups: 55,
  Quarterfinals: 68,
  Semifinals: 75,
  Final: 80,
};

const counterTemplateIds = (score: TeamScore): string[] => {
  const metrics = score.metrics;
  if (metrics.engage < 42) return ["poke-siege", "front-to-back-scaling"];
  if (metrics.peel < 42) return ["dive-comp", "pick-comp"];
  if (metrics.frontline < 40) return ["dive-comp", "control-mage-teamfight"];
  if (metrics.earlyGame < 43) return ["early-objective", "bot-lane-snowball"];
  if (metrics.waveClear < 45) return ["poke-siege", "split-push-pressure"];
  if (metrics.scaling < 48) return ["front-to-back-scaling", "protect-carry"];
  return ["control-mage-teamfight", "front-to-back-scaling"];
};

const pickTemplate = (
  organization: EnemyOrganizationProfile,
  userTeamScore: TeamScore,
  stage: TournamentStage,
) => {
  const counters =
    stage === "Semifinals" || stage === "Final"
      ? counterTemplateIds(userTeamScore)
      : [];
  const preferred = competitiveCompTemplates.filter(
    (template) =>
      organization.preferredTemplates.includes(template.id) ||
      counters.includes(template.id),
  );
  return weightedPick(
    preferred.length ? preferred : competitiveCompTemplates,
    (template) =>
      template.difficultyWeight *
      (organization.preferredTemplates.includes(template.id) ? 1.4 : 1) *
      (counters.includes(template.id) ? 1.5 : 1),
  );
};

const pickOrganization = (
  stage: TournamentStage,
  excludedIds: string[],
  groupStrength?: "weak" | "medium" | "strong",
) => {
  let tiers = stageTierPool[stage];
  if (stage === "Groups" && groupStrength) {
    tiers =
      groupStrength === "weak"
        ? ["Wildcard"]
        : groupStrength === "medium"
          ? ["Regional"]
          : ["Major"];
  }
  const candidates = enemyOrganizations.filter(
    (organization) =>
      tiers.includes(organization.tier) &&
      !excludedIds.includes(organization.id),
  );
  return weightedPick(
    candidates.length ? candidates : enemyOrganizations.filter((entry) => tiers.includes(entry.tier)),
    (organization) =>
      organization.draftDiscipline +
      organization.objectiveFocus +
      organization.adaptability,
  );
};

const buildEnemy = (
  organization: EnemyOrganizationProfile,
  template: CompetitiveCompTemplate,
  userTeamScore: TeamScore,
  stage: TournamentStage,
  difficulty: GameDifficulty,
  groupStrength?: "weak" | "medium" | "strong",
): CompetitiveEnemyTeam => {
  const organizationQuality = average([
    organization.draftDiscipline,
    organization.objectiveFocus,
    organization.adaptability,
  ]);
  const tournamentDifficulty = clamp(
    stageBaseDifficulty[stage] +
      tournamentDifficultyScaling[difficulty].stages[stage] +
      (organizationQuality - 75) * 0.25 +
      (stage === "Groups" && groupStrength
        ? groupStrengthDifficultyModifier[groupStrength]
        : 0),
  );
  const pickedIds: string[] = [];
  const simulatedDraft: DraftTeam = ROLES.map((role) => {
    const champion = getMetaWeightedChampionForRole(
      role,
      tournamentDifficulty,
      template.archetype,
      pickedIds,
    );
    pickedIds.push(champion.id);
    return { role, champion, items: [] };
  });
  const validation = validateEnemyDraft(simulatedDraft);
  const generatedScore = calculateTeamScore(simulatedDraft, "Classic");
  const metaRating = clamp(
    average(
      simulatedDraft.map((build) =>
        getChampionMetaRoleProfile(build.champion, build.role).priority,
      ),
    ) *
      0.72 +
      organization.draftDiscipline * 0.28,
  );
  const draftCoherence = clamp(
    validation.score * 0.58 +
      generatedScore.metrics.roleFit * 0.2 +
      organization.draftDiscipline * 0.22,
  );
  const rulesAdaptation = clamp(
    generatedScore.metrics.rulesAdaptation * 0.58 +
      organization.adaptability * 0.42,
  );
  const modifiers = {
    earlyPressure: Math.round(organization.aggression / 10),
    scaling: Math.round(organization.scalingPreference / 10),
    teamFight: Math.round(organization.draftDiscipline / 10),
    pickoff: Math.round(organization.adaptability / 12),
    objectiveControl: Math.round(organization.objectiveFocus / 9),
    antiAD: userTeamScore.metrics.physicalDamage - userTeamScore.metrics.magicDamage > 28 ? stage === "Final" ? 10 : 7 : 3,
    antiAP: userTeamScore.metrics.magicDamage - userTeamScore.metrics.physicalDamage > 28 ? stage === "Final" ? 10 : 7 : 3,
    punishNoFrontline: stage === "Final" ? 12 : stage === "Semifinals" ? 10 : 7,
    punishBadItems: 0,
  };
  const punishProfile = {
    punishesNoFrontline: userTeamScore.metrics.frontline < 42,
    punishesLowPeel: userTeamScore.metrics.peel < 44,
    punishesFullAD: userTeamScore.metrics.physicalDamage - userTeamScore.metrics.magicDamage > 28,
    punishesFullAP: userTeamScore.metrics.magicDamage - userTeamScore.metrics.physicalDamage > 28,
    punishesBadItems: false,
    punishesLowWaveClear: userTeamScore.metrics.waveClear < 45,
    punishesNoEngage: userTeamScore.metrics.engage < 42,
    punishesLowScaling: userTeamScore.metrics.scaling < 48,
  };

  return {
    id: organization.id,
    name: organization.name,
    tier: organization.tier,
    stage,
    difficulty: clamp(
      tournamentDifficulty * 0.55 +
        metaRating * 0.17 +
        draftCoherence * 0.18 +
        rulesAdaptation * 0.1,
      45,
      98,
    ),
    archetype: template.archetype,
    strengths: template.strengths,
    weaknesses: template.weaknesses,
    modifiers,
    templateId: template.id,
    templateName: template.name,
    metaRating,
    draftCoherence,
    rulesAdaptation,
    simulatedDraft,
    winCondition: template.winCondition,
    mainThreat: template.strengths.slice(0, 2).join(" e "),
    punishProfile,
  };
};

export function generateCounterMetaEnemy(
  userTeamScore: TeamScore,
  stage: TournamentStage,
  difficulty: GameDifficulty,
  excludedOrganizationIds: string[] = [],
  groupStrength?: "weak" | "medium" | "strong",
): CompetitiveEnemyTeam {
  const organization = pickOrganization(
    stage,
    excludedOrganizationIds,
    groupStrength,
  );
  let bestEnemy: CompetitiveEnemyTeam | undefined;
  let bestValidationScore = -1;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const enemy = buildEnemy(
      organization,
      pickTemplate(organization, userTeamScore, stage),
      userTeamScore,
      stage,
      difficulty,
      groupStrength,
    );
    const validation = validateEnemyDraft(enemy.simulatedDraft);
    if (!bestEnemy || validation.score > bestValidationScore) {
      bestEnemy = enemy;
      bestValidationScore = validation.score;
    }
    if (validation.score >= validationThreshold[stage]) return enemy;
  }
  return bestEnemy!;
}
